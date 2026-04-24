#!/bin/bash
# =============================================================================
# Deploy do programa URV Privacy na Solana Devnet
# Execute este script a partir da raiz do projeto rhema-care-flow
# =============================================================================

set -e

echo "🔧 Verificando dependências..."

# 1. Verifica Solana CLI
if ! command -v solana &> /dev/null; then
  echo "❌ Solana CLI não encontrado. Instale com:"
  echo "   sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
  exit 1
fi

# 2. Verifica Anchor CLI
if ! command -v anchor &> /dev/null; then
  echo "❌ Anchor CLI não encontrado. Instale com:"
  echo "   cargo install --git https://github.com/coral-xyz/anchor avm --locked"
  echo "   avm install 0.30.1 && avm use 0.30.1"
  exit 1
fi

# 3. Verifica Rust
if ! command -v cargo &> /dev/null; then
  echo "❌ Rust não encontrado. Instale com:"
  echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
  exit 1
fi

echo "✅ Dependências OK"

# =============================================================================
# CONFIGURAÇÃO
# =============================================================================

echo ""
echo "🌐 Configurando Solana para Devnet..."
solana config set --url https://api.devnet.solana.com

echo "📋 Sua configuração atual:"
solana config get

echo ""
echo "💰 Verificando saldo..."
BALANCE=$(solana balance 2>/dev/null || echo "0 SOL")
echo "Saldo: $BALANCE"

# Solicita airdrop se saldo for baixo
if [[ "$BALANCE" == "0 SOL" || "$BALANCE" == "0.0"* ]]; then
  echo "⚡ Saldo baixo. Solicitando airdrop de 2 SOL..."
  solana airdrop 2
  sleep 3
  echo "Novo saldo: $(solana balance)"
fi

# =============================================================================
# BUILD
# =============================================================================

echo ""
echo "🔨 Entrando na pasta anchor/ e buildando..."
cd anchor

anchor build

echo "✅ Build concluído!"

# =============================================================================
# DEPLOY
# =============================================================================

echo ""
echo "🚀 Fazendo deploy na Devnet..."
anchor deploy

# Captura o Program ID gerado
PROGRAM_ID=$(solana address -k target/deploy/urv_privacy-keypair.json)
echo ""
echo "✅ Deploy concluído!"
echo "📌 Program ID: $PROGRAM_ID"

# =============================================================================
# ATUALIZA O .ENV
# =============================================================================

cd ..

echo ""
echo "📝 Atualizando .env com o Program ID..."

# Adiciona ou substitui VITE_URV_PROGRAM_ID no .env
if grep -q "VITE_URV_PROGRAM_ID" .env 2>/dev/null; then
  sed -i "s|VITE_URV_PROGRAM_ID=.*|VITE_URV_PROGRAM_ID=\"$PROGRAM_ID\"|" .env
else
  echo "VITE_URV_PROGRAM_ID=\"$PROGRAM_ID\"" >> .env
fi

echo "✅ .env atualizado"

# =============================================================================
# COPIA IDL GERADO
# =============================================================================

echo ""
echo "📋 Copiando IDL gerado para src/idl/..."
cp anchor/target/idl/urv_privacy.json src/idl/urv_privacy.json
echo "✅ IDL atualizado em src/idl/urv_privacy.json"

# =============================================================================
# INSTRUÇÃO FINAL
# =============================================================================

echo ""
echo "============================================================"
echo "✅ DEPLOY COMPLETO"
echo "============================================================"
echo ""
echo "Program ID: $PROGRAM_ID"
echo ""
echo "Próximos passos:"
echo "1. Atualize PROGRAM_ID em src/components/blockchain/UrvDemo.tsx:"
echo "   const PROGRAM_ID = new PublicKey('$PROGRAM_ID');"
echo ""
echo "2. Atualize PROGRAM_ID em src/components/UrvDemo.tsx (se existir)"
echo ""
echo "3. Rode npm run dev para testar localmente"
echo ""
echo "4. Faça commit das mudanças:"
echo "   git add .env src/idl/urv_privacy.json"
echo "   git commit -m 'chore: atualiza Program ID e IDL após anchor deploy'"
echo "   git push"
echo "============================================================"
