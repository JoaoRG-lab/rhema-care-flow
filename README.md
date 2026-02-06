# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Lovable Cloud)
- Solana/Anchor (Blockchain integration)

## URV Health Value Chain - Blockchain Integration

This project includes a privacy-preserving blockchain registry for healthcare data integrity.

### Privacy Design

**CRITICAL: No PHI/PII is ever stored on-chain.**

#### What IS stored on-chain:
- **Data Hashes**: SHA-256 hashes of canonical JSON records
- **URI Pointers**: References to encrypted off-chain storage
- **Score Updates**: Chained hashes for audit trail integrity

#### What is NOT stored on-chain:
- Patient names, addresses, or contact information
- Medical records, diagnoses, or treatment details
- Any data that could identify an individual

### Production Deployment

#### Prerequisites

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Install Anchor CLI  
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

#### Deploy to Devnet

```bash
# 1. Configure Solana for devnet
solana config set --url devnet

# 2. Create a new keypair (or use existing)
solana-keygen new --outfile ~/.config/solana/id.json

# 3. Airdrop SOL for deployment fees
solana airdrop 2

# 4. Navigate to anchor folder and build
cd anchor
anchor build

# 5. Deploy to devnet
anchor deploy --provider.cluster devnet
```

#### Update Frontend After Deployment

```bash
# 1. Copy the generated IDL
cp anchor/target/idl/urv_privacy.json src/idl/urv_privacy.json

# 2. Get the program ID from deployment output or:
solana address -k anchor/target/deploy/urv_privacy-keypair.json

# 3. Update URV_PROGRAM_ID in src/lib/solana.ts with the program ID
```

See `/anchor/README.md` for detailed instructions.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
