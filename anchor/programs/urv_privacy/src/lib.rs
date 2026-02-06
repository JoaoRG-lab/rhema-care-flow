use anchor_lang::prelude::*;

declare_id!("URVPr1vacy11111111111111111111111111111111"); // troque após deploy

#[program]
pub mod urv_privacy {
    use super::*;

    pub fn init_state(ctx: Context<InitState>, oracle: Pubkey) -> Result<()> {
        let st = &mut ctx.accounts.state;
        st.admin = ctx.accounts.admin.key();
        st.oracle = oracle;
        st.last_score_u32 = 0;
        st.last_score_hash = [0u8; 32];
        st.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn create_record(
        ctx: Context<CreateRecord>,
        data_hash: [u8; 32],
        uri: String,
        schema_version: u16,
    ) -> Result<()> {
        require!(uri.len() <= 200, UError::UriTooLong);
        let rec = &mut ctx.accounts.record;
        rec.owner = ctx.accounts.owner.key();
        rec.data_hash = data_hash;
        rec.uri = uri;
        rec.schema_version = schema_version;
        rec.created_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn post_score_update(
        ctx: Context<PostScoreUpdate>,
        record_data_hash: [u8; 32],
        features_hash: [u8; 32],
        score_u32: u32,
        confidence_bps: u16,
        prev_score_hash: [u8; 32],
        new_score_hash: [u8; 32],
    ) -> Result<()> {
        require!(confidence_bps <= 10_000, UError::BadConfidence);
        let st = &mut ctx.accounts.state;
        require!(ctx.accounts.oracle.key() == st.oracle, UError::NotOracle);
        require!(prev_score_hash == st.last_score_hash, UError::BadPrevHash);

        // step limiter ±5%
        let last = st.last_score_u32;
        let step = (last / 20).max(1);
        let max_up = last.saturating_add(step);
        let min_dn = last.saturating_sub(step);
        require!(score_u32 >= min_dn && score_u32 <= max_up, UError::DeltaTooLarge);

        let up = &mut ctx.accounts.update;
        up.oracle = ctx.accounts.oracle.key();
        up.record_data_hash = record_data_hash;
        up.features_hash = features_hash;
        up.score_u32 = score_u32;
        up.confidence_bps = confidence_bps;
        up.prev_score_hash = prev_score_hash;
        up.new_score_hash = new_score_hash;
        up.created_at = Clock::get()?.unix_timestamp;

        st.last_score_u32 = score_u32;
        st.last_score_hash = new_score_hash;
        st.updated_at = up.created_at;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitState<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = 8 + UrvState::SIZE,
        seeds = [b"state", admin.key().as_ref()],
        bump
    )]
    pub state: Account<'info, UrvState>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(data_hash: [u8; 32])]
pub struct CreateRecord<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        payer = owner,
        space = 8 + Record::MAX_SIZE,
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
        bump
    )]
    pub state: Account<'info, UrvState>,
    #[account(
        init,
        payer = oracle,
        space = 8 + ScoreUpdate::SIZE,
        seeds = [b"upd", state.key().as_ref(), &new_score_hash],
        bump
    )]
    pub update: Account<'info, ScoreUpdate>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct UrvState {
    pub admin: Pubkey,
    pub oracle: Pubkey,
    pub last_score_u32: u32,
    pub last_score_hash: [u8; 32],
    pub updated_at: i64,
}

impl UrvState {
    pub const SIZE: usize = 32 + 32 + 4 + 32 + 8;
}

#[account]
pub struct Record {
    pub owner: Pubkey,
    pub data_hash: [u8; 32],
    pub schema_version: u16,
    pub created_at: i64,
    pub uri: String,
}

impl Record {
    pub const MAX_URI: usize = 200;
    pub const MAX_SIZE: usize = 32 + 32 + 2 + 8 + 4 + Self::MAX_URI;
}

#[account]
pub struct ScoreUpdate {
    pub oracle: Pubkey,
    pub record_data_hash: [u8; 32],
    pub features_hash: [u8; 32],
    pub score_u32: u32,
    pub confidence_bps: u16,
    pub prev_score_hash: [u8; 32],
    pub new_score_hash: [u8; 32],
    pub created_at: i64,
}

impl ScoreUpdate {
    pub const SIZE: usize = 32 + 32 + 32 + 4 + 2 + 32 + 32 + 8;
}

#[error_code]
pub enum UError {
    #[msg("URI too long")]
    UriTooLong,
    #[msg("Bad confidence")]
    BadConfidence,
    #[msg("Caller is not oracle")]
    NotOracle,
    #[msg("Bad previous score hash")]
    BadPrevHash,
    #[msg("Score delta too large")]
    DeltaTooLarge,
}
