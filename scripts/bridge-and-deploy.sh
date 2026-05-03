#!/usr/bin/env bash
# bridge-and-deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
# One-shot: bridge fee juice from Sepolia → Aztec testnet, then deploy the
# PrivateVoting contract using aztec-wallet.
#
# Usage:
#   L1_PRIVATE_KEY=0x... bash scripts/bridge-and-deploy.sh
#
# Prerequisites:
#   1. L1_PRIVATE_KEY — a Sepolia private key that holds ≥ 0.01 SepoliaETH
#      (for gas on the FeeAssetHandler.mint() call)
#   2. aztec-wallet in PATH:
#        export PATH="$HOME/.aztec/versions/4.3.0-nightly.20260430/bin:$PATH"
#   3. Contracts compiled: contracts/target/private_voting-PrivateVoting.json
#      If missing: cd contracts && nargo compile
#   4. aztec-wallet accounts set up (run once if not done):
#        aztec-wallet create-account --alias deployer
#        aztec-wallet deploy-account --from accounts:deployer
#
# The script will:
#   1. Get the deployer L2 address from the wallet
#   2. Bridge 1000 FJ (1e21 base units) from Sepolia to the deployer address
#   3. Wait up to 15 minutes for L2 inclusion (polls every 60s)
#   4. Deploy the PrivateVoting contract using aztec-wallet deploy
#   5. Write the address to deployments/alpha-testnet.json
#
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

AZTEC_NODE_URL="${AZTEC_NODE_URL:-https://rpc.testnet.aztec-labs.com}"
L1_RPC_URL="${L1_RPC_URL:-https://rpc.sepolia.org}"
FEE_JUICE_AMOUNT="1000000000000000000000"  # 1000 FJ
DEPLOYER_ALIAS="${DEPLOYER_ALIAS:-deployer}"

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
  echo "  Run: export PATH=\"\$HOME/.aztec/versions/4.3.0-nightly.20260430/bin:\$PATH\""
  exit 1
fi

if [ ! -f "${ARTIFACT}" ]; then
  echo "ERROR: Contract artifact not found at ${ARTIFACT}"
  echo "  Run: cd ${REPO_ROOT}/contracts && nargo compile"
  exit 1
fi

export AZTEC_NODE_URL

echo ""
echo "Node URL: ${AZTEC_NODE_URL}"
echo "L1 RPC:   ${L1_RPC_URL}"

# ── 1. Resolve deployer address from wallet ──────────────────────────────────
echo ""
echo "── Step 1: Resolve deployer address from wallet ──"

# Check if 'deployer' alias exists; if not, fall back to 'accounts:last'
DEPLOYER_ADDRESS=""
if aztec-wallet get-alias "accounts:${DEPLOYER_ALIAS}" 2>/dev/null | grep -q "0x"; then
  DEPLOYER_ADDRESS=$(aztec-wallet get-alias "accounts:${DEPLOYER_ALIAS}" 2>/dev/null | grep -o '0x[0-9a-f]*' | head -1)
  echo "   Using alias '${DEPLOYER_ALIAS}': ${DEPLOYER_ADDRESS}"
elif aztec-wallet get-alias "accounts:last" 2>/dev/null | grep -q "0x"; then
  DEPLOYER_ADDRESS=$(aztec-wallet get-alias "accounts:last" 2>/dev/null | grep -o '0x[0-9a-f]*' | head -1)
  DEPLOYER_ALIAS="last"
  echo "   No '${DEPLOYER_ALIAS}' alias found. Using last account: ${DEPLOYER_ADDRESS}"
else
  echo "ERROR: No accounts found in aztec-wallet."
  echo "  Create and deploy an account first:"
  echo "    aztec-wallet create-account --alias deployer"
  echo "    aztec-wallet deploy-account --from accounts:deployer --payment method=fee_juice,claim=true"
  exit 1
fi

if [ -z "${DEPLOYER_ADDRESS}" ]; then
  echo "ERROR: Could not resolve deployer address."
  exit 1
fi

echo ""
echo "── Step 2: Check current fee juice balance ──"
BALANCE=$(aztec-wallet get-fee-juice-balance "${DEPLOYER_ADDRESS}" 2>&1 | grep "Fee Juice" | grep -o '[0-9]* FJ' | head -1 || echo "0 FJ")
echo "   Current balance: ${BALANCE}"

if [[ "${BALANCE}" != "0 FJ" ]] && [[ "${BALANCE}" != "" ]]; then
  echo "   ✓ Already funded — skipping bridge step."
else
  echo ""
  echo "── Step 3: Bridge fee juice from L1 (Sepolia) ──"
  echo "   Recipient:  ${DEPLOYER_ADDRESS}"
  echo "   Amount:     ${FEE_JUICE_AMOUNT} (1000 FJ)"
  echo "   Calling FeeAssetHandler.mint() on Sepolia → bridges to L2"
  echo "   This will take 5–15 minutes for L2 inclusion."
  echo ""

  aztec-wallet bridge-fee-juice \
    "${FEE_JUICE_AMOUNT}" \
    "${DEPLOYER_ADDRESS}" \
    --l1-rpc-urls "${L1_RPC_URL}" \
    --l1-private-key "${L1_PRIVATE_KEY}" \
    --mint \
    --l1-chain-id 11155111 \
    2>&1

  echo ""
  echo "── Step 4: Wait for fee juice on L2 ──"
  echo "   Polling until balance > 0 (up to 15 minutes)..."

  for i in $(seq 1 15); do
    sleep 60
    BALANCE=$(aztec-wallet get-fee-juice-balance "${DEPLOYER_ADDRESS}" 2>&1 | grep "Fee Juice" | grep -o '[0-9]* FJ' | head -1 || echo "0 FJ")
    echo "   [${i}/15] Balance: ${BALANCE}"
    if [[ "${BALANCE}" != "0 FJ" ]] && [[ "${BALANCE}" != "" ]]; then
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
fi

echo ""
echo "── Step 5: Deploy PrivateVoting contract ──"
echo "   Artifact:  ${ARTIFACT}"
echo "   Deployer:  accounts:${DEPLOYER_ALIAS} (${DEPLOYER_ADDRESS})"
echo ""

# Build constructor args from deploy.config.json
CONFIG_PATH="${REPO_ROOT}/scripts/deploy.config.json"
if [ ! -f "${CONFIG_PATH}" ]; then
  echo "ERROR: deploy.config.json not found at ${CONFIG_PATH}"
  exit 1
fi

# Read config values using python3
TITLE=$(python3 -c "import json; c=json.load(open('${CONFIG_PATH}')); print(c['title'])")
OPTIONS=$(python3 -c "import json; c=json.load(open('${CONFIG_PATH}')); print(len(c['options']))")
START_OFFSET=$(python3 -c "import json; c=json.load(open('${CONFIG_PATH}')); print(c.get('startTimeOffsetSeconds',0))")
DURATION=$(python3 -c "import json; c=json.load(open('${CONFIG_PATH}')); print(c['durationSeconds'])")
QUORUM=$(python3 -c "import json; c=json.load(open('${CONFIG_PATH}')); print(c['quorum'])")
ELIGIBILITY_MODE=$(python3 -c "import json; c=json.load(open('${CONFIG_PATH}')); modes={'open':0,'token':1,'allowlist':2}; print(modes[c['eligibilityMode']])")
NOW=$(date +%s)
START_TIME=$((NOW + START_OFFSET))
END_TIME=$((START_TIME + DURATION))

echo "   Vote title:  ${TITLE}"
echo "   Options:     ${OPTIONS}"
echo "   Eligibility: ${ELIGIBILITY_MODE} (0=open)"
echo "   Start:       $(date -d @${START_TIME} -u '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date -r ${START_TIME} -u '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || echo "${START_TIME}")"
echo "   End:         $(date -d @${END_TIME} -u '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date -r ${END_TIME} -u '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || echo "${END_TIME}")"
echo ""

# Deploy using aztec-wallet deploy
# Constructor: constructor(admin, VoteConfig)
# VoteConfig is a struct — pass as individual args to the constructor
# args: admin_address options_count start_time end_time quorum eligibility_mode token_address(zero) min_token_balance(0)
DEPLOY_OUTPUT=$(aztec-wallet deploy \
  "${ARTIFACT}" \
  --from "accounts:${DEPLOYER_ALIAS}" \
  --alias "contracts:PrivateVoting" \
  --args \
    "${DEPLOYER_ADDRESS}" \
    "${OPTIONS}" \
    "${START_TIME}" \
    "${END_TIME}" \
    "${QUORUM}" \
    "${ELIGIBILITY_MODE}" \
    "0x0000000000000000000000000000000000000000000000000000000000000000" \
    "0" \
  --payment method=fee_juice \
  2>&1)

echo "${DEPLOY_OUTPUT}"

# Extract contract address from output
CONTRACT_ADDRESS=$(echo "${DEPLOY_OUTPUT}" | grep -o 'Contract deployed at 0x[0-9a-f]*' | grep -o '0x[0-9a-f]*' | head -1 || true)
if [ -z "${CONTRACT_ADDRESS}" ]; then
  # Try alternate grep patterns
  CONTRACT_ADDRESS=$(echo "${DEPLOY_OUTPUT}" | grep -o '"address":"0x[0-9a-f]*"' | grep -o '0x[0-9a-f]*' | head -1 || true)
fi
if [ -z "${CONTRACT_ADDRESS}" ]; then
  CONTRACT_ADDRESS=$(echo "${DEPLOY_OUTPUT}" | grep -o '0x[0-9a-f]\{64\}' | tail -1 || true)
fi

if [ -z "${CONTRACT_ADDRESS}" ]; then
  echo ""
  echo "WARNING: Could not auto-extract contract address from output above."
  echo "  Look for the deployed address in the output and add it manually to:"
  echo "    deployments/alpha-testnet.json"
  echo "    demo/.env.local as NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS"
else
  echo ""
  echo "  Contract address: ${CONTRACT_ADDRESS}"

  # Write deployments/alpha-testnet.json
  OUT_PATH="${REPO_ROOT}/deployments/alpha-testnet.json"
  mkdir -p "$(dirname "${OUT_PATH}")"
  python3 -c "
import json, sys
out = {
  'network': 'aztec-alpha-testnet',
  'contractAddress': '${CONTRACT_ADDRESS}',
  'deployedAt': '$(date -u +%Y-%m-%dT%H:%M:%SZ)',
  'deployer': '${DEPLOYER_ADDRESS}',
  'title': '${TITLE}',
  'options': $(python3 -c "import json; c=json.load(open('${CONFIG_PATH}')); print(json.dumps(c['options']))"),
  'startTime': ${START_TIME}000,
  'endTime': ${END_TIME}000,
  'quorum': ${QUORUM},
  'eligibilityMode': '$(python3 -c "import json; c=json.load(open('${CONFIG_PATH}')); print(c['eligibilityMode'])")'
}
print(json.dumps(out, indent=2))
" > "${OUT_PATH}"
  echo "  Wrote: ${OUT_PATH}"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo " Done."
echo ""
echo " Next steps:"
echo "  1. Add to demo/.env.local:"
echo "       NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS=${CONTRACT_ADDRESS:-<address from output>}"
echo "  2. Take a screenshot of <VoteReceipt /> in the demo app"
echo "  3. Update GRANT.md with the live contract address"
echo "  4. Post grant pitch to Aztec Discord #grants"
echo "═══════════════════════════════════════════════"
