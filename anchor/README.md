# URV Health Value Chain - Anchor Program

## Overview

This directory contains the Solana Anchor program for the URV Health Value Chain, a privacy-preserving on-chain proof registry for healthcare data.

## Privacy Design

**CRITICAL: No PHI/PII is ever stored on-chain.**

### What IS stored on-chain:
- **Data Hashes**: SHA-256 hashes of canonical JSON records
- **URI Pointers**: References to encrypted off-chain storage (IPFS, cloud)
- **Score Updates**: Chained hashes for audit trail integrity
- **Timestamps**: When records and updates were created

### What is NOT stored on-chain:
- Patient names, addresses, or contact information
- Medical records, diagnoses, or treatment details
- Any data that could identify an individual

## Program Architecture

### PDAs (Program Derived Addresses)

| PDA | Seeds | Purpose |
|-----|-------|---------|
| State | `["state", admin]` | Global configuration with admin and oracle |
| Record | `["rec", owner, data_hash]` | Individual health record proof |
| Update | `["upd", state, new_score_hash]` | Chained score update |

### Instructions

1. **init_state** - Initialize global state with admin and oracle
2. **create_record** - Register a new health record proof
3. **post_score_update** - Record a URV score update with chaining

### Step Limiter

The program enforces a ±5% maximum score change per update to prevent manipulation.

## Building & Deploying

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### Build

```bash
cd anchor
anchor build
```

### Deploy to Devnet

```bash
# Configure Solana for devnet
solana config set --url devnet

# Airdrop SOL for deployment
solana airdrop 2

# Deploy
anchor deploy
```

### Update Frontend

After deployment:

1. Copy the program ID from the deployment output
2. Update `URV_PROGRAM_ID` in `src/lib/solana.ts`
3. Copy `target/idl/urv_privacy.json` to `src/idl/urv_privacy.json`

## Testing

```bash
anchor test
```

## Security Considerations

1. **Oracle Authorization**: Only the designated oracle can post score updates
2. **Step Limiting**: Prevents dramatic score manipulation
3. **Hash Chaining**: Creates immutable audit trail
4. **No PHI On-Chain**: Sensitive data stays encrypted off-chain

## Production Checklist

- [ ] Audit the program code
- [ ] Use hardware wallet for deployment
- [ ] Set up proper oracle key rotation
- [ ] Configure monitoring for events
- [ ] Test thoroughly on devnet before mainnet
