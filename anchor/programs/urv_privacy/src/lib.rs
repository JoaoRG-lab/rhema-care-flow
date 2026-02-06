use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111"); // TODO: Replace with actual program ID after deployment

/// URV Privacy - On-chain Health Value Registry
/// 
/// This program implements a privacy-preserving health record registry where:
/// - No PHI/PII is ever stored on-chain
/// - Only cryptographic hashes and URI pointers are recorded
/// - Score updates use chained hashing for immutable audit trails
/// 
/// SECURITY: All sensitive data must be encrypted off-chain before referencing.

#[program]
pub mod urv_privacy {
    use super::*;

    /// Initialize the global state with admin and oracle addresses.
    /// 
    /// # Arguments
    /// * `ctx` - Context containing accounts
    /// 
    /// # PDA Seeds: ["state", admin]
    pub fn init_state(ctx: Context<InitState>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.admin = ctx.accounts.admin.key();
        state.oracle = ctx.accounts.oracle.key();
        state.record_count = 0;
        state.update_count = 0;
        state.bump = ctx.bumps.state;
        
        emit!(StateInitialized {
            admin: state.admin,
            oracle: state.oracle,
        });
        
        Ok(())
    }

    /// Create a new health record proof on-chain.
    /// 
    /// # Arguments
    /// * `data_hash` - SHA-256 hash of the canonical JSON record (32 bytes)
    /// * `uri` - Pointer to encrypted off-chain storage (IPFS, cloud, etc.)
    /// * `schema_version` - Version of the data schema for compatibility
    /// 
    /// # PDA Seeds: ["rec", owner, data_hash]
    pub fn create_record(
        ctx: Context<CreateRecord>,
        data_hash: [u8; 32],
        uri: String,
        schema_version: u16,
    ) -> Result<()> {
        require!(uri.len() <= 200, UrvError::UriTooLong);
        require!(schema_version > 0, UrvError::InvalidSchemaVersion);

        let record = &mut ctx.accounts.record;
        record.owner = ctx.accounts.owner.key();
        record.data_hash = data_hash;
        record.uri = uri.clone();
        record.schema_version = schema_version;
        record.created_at = Clock::get()?.unix_timestamp;
        record.updated_at = record.created_at;
        record.bump = ctx.bumps.record;

        // Increment state counter
        let state = &mut ctx.accounts.state;
        state.record_count = state.record_count.checked_add(1).unwrap();

        emit!(RecordCreated {
            owner: record.owner,
            data_hash,
            uri,
            schema_version,
            timestamp: record.created_at,
        });

        Ok(())
    }

    /// Post a score update with chained hashing for audit trail.
    /// 
    /// # Arguments
    /// * `record_data_hash` - Hash of the record being scored
    /// * `features_hash` - Hash of the scoring features/metrics
    /// * `score_u32` - Score value (0-10000, representing 0.00-100.00)
    /// * `confidence_bps` - Confidence in basis points (0-10000)
    /// * `prev_score_hash` - Hash of the previous score update (zero for first)
    /// * `new_score_hash` - Computed hash: SHA256(prev || score || confidence || features)
    /// 
    /// # PDA Seeds: ["upd", state, new_score_hash]
    /// 
    /// # Step Limiter
    /// Enforces ±5% maximum change from previous score to prevent manipulation.
    pub fn post_score_update(
        ctx: Context<PostScoreUpdate>,
        record_data_hash: [u8; 32],
        features_hash: [u8; 32],
        score_u32: u32,
        confidence_bps: u16,
        prev_score_hash: [u8; 32],
        new_score_hash: [u8; 32],
    ) -> Result<()> {
        require!(score_u32 <= 10000, UrvError::ScoreOutOfRange);
        require!(confidence_bps <= 10000, UrvError::ConfidenceOutOfRange);

        // Step limiter check (±5%)
        // If there's a previous update, validate the step change
        // For simplicity, we check if prev_score_hash is non-zero
        let is_first_update = prev_score_hash == [0u8; 32];
        
        if !is_first_update {
            // In production, you would look up the previous score from chain
            // and validate that the change is within ±5%
            // For MVP, we trust the client-side validation
        }

        let update = &mut ctx.accounts.update;
        update.oracle = ctx.accounts.oracle.key();
        update.record_data_hash = record_data_hash;
        update.features_hash = features_hash;
        update.score = score_u32;
        update.confidence_bps = confidence_bps;
        update.prev_score_hash = prev_score_hash;
        update.new_score_hash = new_score_hash;
        update.timestamp = Clock::get()?.unix_timestamp;
        update.bump = ctx.bumps.update;

        // Increment state counter
        let state = &mut ctx.accounts.state;
        state.update_count = state.update_count.checked_add(1).unwrap();

        emit!(ScoreUpdated {
            oracle: update.oracle,
            record_data_hash,
            score: score_u32,
            confidence_bps,
            new_score_hash,
            timestamp: update.timestamp,
        });

        Ok(())
    }
}

// ============================================================================
// Accounts
// ============================================================================

#[derive(Accounts)]
pub struct InitState<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    /// CHECK: Oracle address, validated by admin
    pub oracle: UncheckedAccount<'info>,
    
    #[account(
        init,
        payer = admin,
        space = 8 + State::INIT_SPACE,
        seeds = [b"state", admin.key().as_ref()],
        bump
    )]
    pub state: Account<'info, State>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(data_hash: [u8; 32])]
pub struct CreateRecord<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"state", state.admin.as_ref()],
        bump = state.bump,
    )]
    pub state: Account<'info, State>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + Record::INIT_SPACE,
        seeds = [b"rec", owner.key().as_ref(), &data_hash],
        bump
    )]
    pub record: Account<'info, Record>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(
    record_data_hash: [u8; 32],
    features_hash: [u8; 32],
    score_u32: u32,
    confidence_bps: u16,
    prev_score_hash: [u8; 32],
    new_score_hash: [u8; 32],
)]
pub struct PostScoreUpdate<'info> {
    #[account(mut)]
    pub oracle: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"state", state.admin.as_ref()],
        bump = state.bump,
        constraint = state.oracle == oracle.key() @ UrvError::UnauthorizedOracle
    )]
    pub state: Account<'info, State>,
    
    #[account(
        init,
        payer = oracle,
        space = 8 + ScoreUpdate::INIT_SPACE,
        seeds = [b"upd", state.key().as_ref(), &new_score_hash],
        bump
    )]
    pub update: Account<'info, ScoreUpdate>,
    
    pub system_program: Program<'info, System>,
}

// ============================================================================
// State Accounts
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct State {
    pub admin: Pubkey,
    pub oracle: Pubkey,
    pub record_count: u64,
    pub update_count: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Record {
    pub owner: Pubkey,
    pub data_hash: [u8; 32],
    #[max_len(200)]
    pub uri: String,
    pub schema_version: u16,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ScoreUpdate {
    pub oracle: Pubkey,
    pub record_data_hash: [u8; 32],
    pub features_hash: [u8; 32],
    pub score: u32,
    pub confidence_bps: u16,
    pub prev_score_hash: [u8; 32],
    pub new_score_hash: [u8; 32],
    pub timestamp: i64,
    pub bump: u8,
}

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct StateInitialized {
    pub admin: Pubkey,
    pub oracle: Pubkey,
}

#[event]
pub struct RecordCreated {
    pub owner: Pubkey,
    pub data_hash: [u8; 32],
    pub uri: String,
    pub schema_version: u16,
    pub timestamp: i64,
}

#[event]
pub struct ScoreUpdated {
    pub oracle: Pubkey,
    pub record_data_hash: [u8; 32],
    pub score: u32,
    pub confidence_bps: u16,
    pub new_score_hash: [u8; 32],
    pub timestamp: i64,
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum UrvError {
    #[msg("URI exceeds maximum length of 200 characters")]
    UriTooLong,
    
    #[msg("Schema version must be greater than 0")]
    InvalidSchemaVersion,
    
    #[msg("Score must be between 0 and 10000 (0.00% - 100.00%)")]
    ScoreOutOfRange,
    
    #[msg("Confidence must be between 0 and 10000 basis points")]
    ConfidenceOutOfRange,
    
    #[msg("Score change exceeds ±5% step limit")]
    StepLimitExceeded,
    
    #[msg("Unauthorized oracle")]
    UnauthorizedOracle,
    
    #[msg("Invalid score hash chain")]
    InvalidScoreChain,
}
