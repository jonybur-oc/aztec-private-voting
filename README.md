# Aztec Private Voting

Private ballot infrastructure for DAOs. Four React components + Aztec Noir contracts.

## What this is

A voting primitive for DAOs that want secret ballots with verifiable tallies. Members vote privately - only the final result is revealed. Built on [Aztec Network](https://aztec.network) and Noir.

## What this is not

- A full governance platform (use Tally, Boardroom, or Snapshot for that).
- A replacement for public voting in all cases.
- Production-ready - this is research code.

## The receipt problem

The hardest part of private voting UX is the receipt — the moment after a voter clicks submit. Every existing system (MACI, Shutter, the NounsDAO experiment) hands back a hex string or a "your vote was recorded" toast. Neither communicates what actually happened.

We treat the receipt as the product. The `<VoteReceipt />` component is built around one design principle: prove the vote was counted without proving how the voter voted. It uses a "vote fingerprint" (the nullifier, renamed for comprehension), download-by-default persistence, and copy written to avoid the words "cryptographic", "zero-knowledge", and "nullifier".

See [`docs/receipt-design.md`](docs/receipt-design.md) for the full design rationale, the specific copy decisions, and the open questions we did not solve.

## Repo layout

```
contracts/                     Noir contracts (PrivateVoting + helpers)
  src/
    main.nr                    contract entrypoint
    eligibility.nr             eligibility verification
    tally.nr                   homomorphic-style tally storage
  Nargo.toml
packages/
  react/                       component library
    src/
      components/              VoteReceipt, PrivateBallot, ...
      hooks/                   useVote, useEligibility, useTally, ...
      aztec/                   PXE/wallet wiring
      index.ts
demo/                          Next.js demo app (active / closed / admin)
docs/
  receipt-design.md            the design contribution
```

## Install

This is a workspace repo. From the root:

```sh
npm install
```

The library itself can be installed from a checked-out repo or, once published, from npm:

```sh
npm install @aztec-private-voting/react @aztec/aztec.js
```

## Usage

```tsx
import {
  AztecProvider,
  useBrowserAztecClient,
  setPrivateVotingArtifact,
  VoteEligibilityProof,
  PrivateBallot,
  VoteReceipt,
  VoteResult,
  VoteAdmin,
} from '@aztec-private-voting/react';
import '@aztec-private-voting/react/src/styles.css';

import artifact from './private_voting-PrivateVoting.json';
setPrivateVotingArtifact(artifact);

function App() {
  const state = useBrowserAztecClient({
    pxeUrl: process.env.NEXT_PUBLIC_AZTEC_PXE_URL!,
    createWallet: createDemoWallet,
  });

  return (
    <AztecProvider {...state}>
      <ActiveVote />
    </AztecProvider>
  );
}
```

A full working example - eligibility check, ballot, receipt, and tally - is in `demo/`.

## Contracts

To compile the Noir contracts:

```sh
npm run build:contracts
```

This produces `contracts/target/private_voting-PrivateVoting.json`. Copy that JSON into `demo/public/` (or wherever your app loads contract artifacts from) before running the demo.

To deploy a fresh `PrivateVoting` contract to Aztec Alpha testnet:

```sh
npm run deploy:testnet
```

Full run book in [docs/deployment.md](docs/deployment.md). The script writes the deployed address to `deployments/alpha-testnet.json`, which the demo reads automatically.

### Aztec Alpha testnet deployment

| Field                | Value                                                           |
| -------------------- | --------------------------------------------------------------- |
| Network              | Aztec Alpha testnet (`https://rpc.testnet.aztec-labs.com`)      |
| `PrivateVoting`      | _populated by `npm run deploy:testnet` - see `deployments/alpha-testnet.json`_ |
| Deployed at          | _populated by deploy script_                                    |

## Running the demo locally

```sh
cd demo
cp .env.example .env.local
# fill in NEXT_PUBLIC_AZTEC_PXE_URL and NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS
npm run dev
```

Open <http://localhost:3000> for the active vote, `/closed` for the result + verifier, `/admin` to deploy a new vote.

## Components

- `<VoteEligibilityProof />` - generates a ZK proof of voting rights, silent on the happy path.
- `<PrivateBallot />` - the vote interface. Submits an encrypted ballot.
- `<VoteReceipt />` - the key piece. Plain-language receipt with the vote fingerprint.
- `<VoteResult />` - tally reveal with built-in verifier for individual receipts.
- `<VoteAdmin />` - configuration UI for governance facilitators.

## Grant

Applying to Aztec Grants Wave 3. Full application in [`GRANT.md`](GRANT.md).

If you're building governance tooling on Aztec, reach out — we're interested in integrations.
