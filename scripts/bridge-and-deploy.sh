#!/usr/bin/env bash
# bridge-and-deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
# One-shot: bridge fee juice from Sepolia → Aztec testnet, then deploy the
# PrivateVoting contract.
#
# Usage:
#   L1_PRIVATE_KEY=0x... bash scripts/bridge-and-deploy.sh
#
# Prerequisites:
#   1. L1_PRIVATE_KEY — a Sepolia private key that holds ≥ 0.01 SepoliaETH
#      (for gas on the FeeAssetHandler.mint() call)
#   2. aztec-wallet in PATH (or run: source ~/.aztec/bin/aztec-up)
#      Tested with v4.3.0-nightly.20260430
#   3. Contracts compiled: contracts/target/private_voting-PrivateVoting.json
#      If missing: cd contracts && nargo compile
#
# The script will:
#   1. Bridge 1000 FJ (1e21 base units) from L1 to the deployer address
#   2. Wait up to 15 minutes for L2 inclusion (polls every 60s)
#   3. Deploy the PrivateVoting contract using the deployer alias
#   4. Write the address to deployments/alpha-testnet.json
#
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

AZTEC_NODE_URL="${AZTEC_NODE_URL:-https://rpc.testnet.aztec-labs.com}"
L1_RPC_URL="${L1_RPC_URL:-https://rpc.sepolia.org}"
DEPLOYER_ADDRESS="0x26cabdd28aef4679c32869515829184c23862409d3b02edb9030386e03deb3ce"
FEE_JUICE_AMOUNT="1000000000000000000000"  # 1000 FJ

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ARTIFACT="${REPO_ROOT}/contracts/target/private_voting-PrivateVoting.json"

echo "═══════════════════════════════════════════════"
echo " Aztec Private Voting — bridge + deploy"
echo "═══════════════════════════════════════════════"

# ── 0. Preflight checks ──────────────────────────────────────────────────────
if [ -z "${L1_PRIVATE_KEY:-}" ]; then
  echo "ERROR: L1_PRIVATE_KEY is not set."
  echo "  Export a Sepolia private key with ≥ 0.01 ETH:"
  echo "  export L1_PRIVATE_KEY=0x..."
  exit 1
fi

if ! command -v aztec-wallet &>/dev/null; then
  echo "ERROR: aztec-wallet not found in PATH."
  echo "  Try: export PATH=\"\$HOME/.aztec/versions/4.3.0-nightly.20260430/bin:\$PATH\""
  exit 1
fi

if [ ! -f "${ARTIFACT}" ]; then
  echo "ERROR: Contract artifact not found at ${ARTIFACT}"
  echo "  Run: cd ${REPO_ROOT}/contracts && nargo compile"
  exit 1
fi

echo ""
echo "Node URL: ${AZTEC_NODE_URL}"
echo "L1 RPC:   ${L1_RPC_URL}"
echo "Deployer: ${DEPLOYER_ADDRESS}"
echo ""

# ── 1. Check current fee juice balance ───────────────────────────────────────
echo "── Step 1: Check current fee juice balance ──"
AZTEC_NODE_URL="${AZTEC_NODE_URL}" aztec-wallet get-fee-juice-balance "${DEPLOYER_ADDRESS}" 2>&1 | grep "Fee Juice"

echo ""
echo "── Step 2: Bridge fee juice from L1 (Sepolia) ──"
echo "   Calling FeeAssetHandler.mint() → bridges ${FEE_JUICE_AMOUNT} FJ to L2"
echo "   This will take 5-15 minutes for L2 inclusion."
echo ""

AZTEC_NODE_URL="${AZTEC_NODE_URL}" \
  aztec-wallet bridge-fee-juice \
    "${FEE_JUICE_AMOUNT}" \
    "${DEPLOYER_ADDRESS}" \
    --l1-rpc-urls "${L1_RPC_URL}" \
    --l1-private-key "${L1_PRIVATE_KEY}" \
    --mint \
    --l1-chain-id 11155111 \
    2>&1

echo ""
echo "── Step 3: Wait for fee juice on L2 ──"
echo "   Polling until balance > 0 (up to 15 minutes)..."

for i in $(seq 1 15); do
  sleep 60
  BALANCE=$(AZTEC_NODE_URL="${AZTEC_NODE_URL}" aztec-wallet get-fee-juice-balance "${DEPLOYER_ADDRESS}" 2>&1 | grep "Fee Juice" | grep -o '[0-9]* FJ' || echo "0 FJ")
  echo "   [${i}/15] Balance: ${BALANCE}"
  if [[ "${BALANCE}" != "0 FJ" ]]; then
    echo "   ✓ Fee juice available."
    break
  fi
  if [ "${i}" -eq 15 ]; then
    echo "ERROR: Fee juice did not appear after 15 minutes."
    echo "  Check L1 tx on Sepolia Etherscan. The bridge may still be in flight."
    echo "  Re-run this script after confirming the L1 tx landed."
    exit 1
  fi
done

echo ""
echo "── Step 4: Deploy PrivateVoting contract ──"
echo ""

AZTEC_NODE_URL="${AZTEC_NODE_URL}" \
  npm run deploy:testnet --prefix "${REPO_ROOT}" 2>&1

echo ""
echo "═══════════════════════════════════════════════"
echo " Done."
echo " Contract address written to: deployments/alpha-testnet.json"
echo ""
echo " Next steps:"
echo "  1. Copy address to demo/.env.local as NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS"
echo "  2. Take a screenshot of the VoteReceipt component"
echo "  3. Update GRANT.md with the live contract address"
echo "  4. Post grant pitch to Aztec Discord #grants"
echo "═══════════════════════════════════════════════"
