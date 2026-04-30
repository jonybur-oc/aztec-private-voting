# Deploying to Aztec Alpha testnet

End-to-end run book for getting a `PrivateVoting` contract live on Aztec Alpha testnet and pointing the demo at it.

## Prerequisites

| Tool                | Version             | Notes                                                                 |
| ------------------- | ------------------- | --------------------------------------------------------------------- |
| Node                | >= 20               | Workspace requires it.                                                |
| `nargo`             | matching `v4.3.0-nightly` | Used by `npm run build:contracts`. Install via `aztec-up`.       |
| Aztec PXE           | matching SDK pin    | Run locally pointed at the testnet node, or use a hosted PXE.         |

Funded testnet account: a Schnorr account with enough fee tokens to pay deployment + a finalize tx.

## 1. Compile the contract

```sh
npm run build:contracts
```

Produces `contracts/target/private_voting-PrivateVoting.json`.

## 2. Start a PXE pointed at testnet

```sh
aztec start --pxe nodeUrl=https://rpc.testnet.aztec-labs.com
```

The PXE will listen on `http://localhost:8080`.

## 3. Edit the deploy config

`scripts/deploy.config.json` controls what the contract is initialised with:

```json
{
  "title": "Should the treasury fund this initiative? (50 ETH)",
  "description": "...",
  "options": ["For", "Against", "Abstain"],
  "startTimeOffsetSeconds": 0,
  "durationSeconds": 604800,
  "quorum": 5,
  "eligibilityMode": "open"
}
```

For token gating:
```json
{
  "...": "...",
  "eligibilityMode": "token",
  "tokenAddress": "0x...",
  "minTokenBalance": "100"
}
```

For an allowlist:
```json
{
  "...": "...",
  "eligibilityMode": "allowlist",
  "allowlistRoot": "0x..."
}
```

## 4. Run the deploy script

```sh
AZTEC_PXE_URL=http://localhost:8080 \
DEPLOYER_SECRET_KEY=0x... \
DEPLOYER_SIGNING_KEY=0x... \
npm run deploy:testnet
```

The script:
1. Connects to the PXE.
2. Bootstraps a Schnorr account from the secret + signing key.
3. Hashes the title with poseidon2.
4. Calls `Contract.deploy(wallet, artifact, [admin, voteConfig], 'constructor')`.
5. Writes the deployment metadata to `deployments/alpha-testnet.json`.

The address printed at the end is what auditors will paste into the explorer and what voters will hit through the demo.

## 5. Point the demo at the deployment

Two ways:

- **Automatic** - the demo reads `deployments/alpha-testnet.json` at build time. After step 4 the address is already wired up; run `npm run dev:demo` and the active/closed/admin pages will use it.
- **Override** - set `NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS=0x...` in `demo/.env.local`. Env var wins over the deployment file.

## 6. Verify the deployment

Open `/closed` after the deadline (or with a manually-finalized vote) and confirm:

- Tally bars render.
- "For auditors" panel shows totals match, double-vote claim, no-individual-choice claim, and links to the contract address + finalize tx.
- The "Verify your vote was counted" verifier round-trips a known-good fingerprint.

## 7. Update the README

Drop the deployed address into the **Contracts** section of `README.md`:

```markdown
## Contracts

Aztec Alpha Network deployment:
- `PrivateVoting`: `0x...`
- Deployed: YYYY-MM-DD
```
