# VON-70: Aztec Private Voting — MVP Spec
_For Claude Code Opus. New repo: jonybur/aztec-private-voting_

---

## What we're building

A React component library + Aztec Noir smart contracts that any DAO can use for private voting. Four components. One Noir contract. Deployable on Aztec Alpha Network.

The focus is the **receipt UX** — the moment after a voter submits their ballot. Currently in all existing systems this is a hex string. We're making it human-readable and trustworthy.

---

## Repo structure

```
jonybur/aztec-private-voting          ← new public repo
  contracts/
    src/
      voting.nr                        ← main Noir contract
      eligibility.nr                   ← membership proof helpers
      tally.nr                         ← tally circuit
    Nargo.toml
  packages/
    react/                             ← the component library
      src/
        components/
          VoteEligibilityProof.tsx
          PrivateBallot.tsx
          VoteResult.tsx
          VoteAdmin.tsx
          VoteReceipt.tsx              ← the key UX piece
        hooks/
          useVote.ts
          useEligibility.ts
          useTally.ts
        index.ts
      package.json
  demo/                                ← Next.js demo app showing it working
    pages/
      index.tsx                        ← demo DAO vote
    package.json
  README.md
  docs/
    receipt-design.md                  ← explains the receipt UX decisions
```

---

## The Noir contract

### `voting.nr`

```rust
// Private voting contract on Aztec
// Eligibility: token-weighted or address list
// Vote: encrypted ballot submission
// Tally: homomorphic aggregation, result revealed at deadline

contract PrivateVoting {
    // Storage
    struct Storage {
        admin: PublicMutable<AztecAddress>,
        vote_config: PublicMutable<VoteConfig>,
        nullifiers: Map<Field, PublicMutable<bool>>,  // prevent double voting
        encrypted_tally: PublicMutable<EncryptedTally>,
        vote_count: PublicMutable<u64>,
        is_finalized: PublicMutable<bool>,
    }

    struct VoteConfig {
        title: Field,                    // hash of title string
        options_count: u8,               // 2 = yes/no, up to 8 options
        start_time: u64,
        end_time: u64,
        quorum: u64,                     // minimum votes to be valid
        eligibility_mode: u8,            // 0 = any address, 1 = token-gated, 2 = allowlist
        token_address: AztecAddress,     // if eligibility_mode == 1
        min_token_balance: u64,          // minimum tokens to vote
    }

    // Cast a private vote
    // The vote choice is encrypted — only the tally is revealed at end
    #[aztec(private)]
    fn cast_vote(
        vote_choice: u8,                 // 0, 1, 2... (index into options)
        eligibility_proof: Field,        // proof of membership/token holding
        nullifier: Field,                // unique per voter per vote — prevents double voting
    ) {
        // Verify eligibility proof
        // Verify nullifier not already used
        // Add encrypted vote to running tally (homomorphic addition)
        // Emit nullifier to public state
    }

    // Reveal tally after deadline
    #[aztec(public)]
    fn finalize_vote() {
        // Only callable after end_time
        // Decrypt the homomorphic tally
        // Store final result publicly
        // Emit VoteFinalized event
    }

    // Verify a single vote was counted (for receipt verification)
    #[aztec(private)]
    fn verify_vote_counted(
        nullifier: Field,
        choice: u8,
    ) -> bool {
        // Returns true if this nullifier is in the set
        // Does NOT reveal the choice — just proves inclusion
    }
}
```

---

## The React components

### `<VoteEligibilityProof />`

Generates a ZK proof that the user is eligible to vote, without revealing their identity.

```tsx
interface VoteEligibilityProofProps {
  voteId: string
  onEligible: (proof: EligibilityProof) => void
  onIneligible: (reason: string) => void
}

// What it renders:
// 1. "Checking eligibility..." (spinner, ~2-5 seconds for proof generation)
// 2. "You're eligible to vote" (green) — with the proof stored in memory
// 3. "You're not eligible" (with reason)

// The proof is generated client-side in the browser using Aztec's SDK
// It proves: "I control an address with ≥ N tokens" WITHOUT revealing the address
```

### `<PrivateBallot />`

The voting interface. Submits an encrypted ballot.

```tsx
interface PrivateBallotProps {
  voteId: string
  options: string[]               // ["For", "Against", "Abstain"]
  eligibilityProof: EligibilityProof
  onVoteCast: (receipt: VoteReceipt) => void
}

// What it renders:
// 1. List of options as radio buttons / cards
// 2. "Cast Private Vote" button
// 3. Loading state: "Submitting your encrypted ballot..."
// 4. On success: hands off to <VoteReceipt />
```

### `<VoteReceipt />` — THE KEY PIECE

This is where the design research lives. The receipt needs to communicate:
- Your vote was counted
- Nobody can see how you voted
- You can verify this yourself, later
- Here's how

```tsx
interface VoteReceiptProps {
  receipt: VoteReceipt               // { nullifier, encryptedVote, txHash, timestamp }
  voteTitle: string
  onDownload: () => void             // downloads receipt as JSON
  onVerify: () => void               // opens verification flow
}

// VoteReceipt type:
interface VoteReceipt {
  nullifier: string                  // your unique vote fingerprint
  txHash: string                     // Aztec transaction hash
  timestamp: number
  voteId: string
  // NOT included: your vote choice. This is intentional and explained in the UI.
}

// What it renders:
// ┌─────────────────────────────────────────────────┐
// │  ✓  Your vote was cast                          │
// │                                                 │
// │  Vote: [Proposal title]                         │
// │  Time: Apr 27, 2026 at 16:23                    │
// │                                                 │
// │  Your vote fingerprint:                         │
// │  [0x3f4a...c29d]  [Copy]                        │
// │                                                 │
// │  This fingerprint proves your vote was counted  │
// │  without revealing how you voted. Save it to    │
// │  verify after the vote closes.                  │
// │                                                 │
// │  [Download receipt]  [How to verify]            │
// └─────────────────────────────────────────────────┘

// "How to verify" opens a plain-language explainer:
// "After the vote closes, you can check that your fingerprint appears
//  in the set of counted votes. This proves your vote was included
//  without revealing your choice. [Open verifier →]"
```

### `<VoteResult />`

Shows the final tally after the vote closes. Includes a link to the on-chain proof.

```tsx
interface VoteResultProps {
  voteId: string
  showVerificationLink: boolean
}

// What it renders:
// - Bar chart of results (% For / Against / Abstain)
// - Total votes cast, quorum status
// - "Results verified on Aztec" with tx link
// - "Verify your vote was counted" button (opens nullifier checker)
```

### `<VoteAdmin />`

Configuration UI for governance facilitators.

```tsx
interface VoteAdminProps {
  onDeploy: (config: VoteConfig) => void
}

// Steps:
// 1. Title and description
// 2. Options (add up to 8)
// 3. Eligibility: "Anyone" / "Token holders" (enter token address + min balance) / "Address list"
// 4. Timing: start / end date/time
// 5. Quorum: minimum votes for valid result
// 6. Preview and deploy
```

---

## The demo app

A Next.js app that shows a complete working vote:

**Page 1: Active vote**
- Shows a proposal: "Should the treasury fund this initiative? (50 ETH)"
- `<VoteEligibilityProof />` → `<PrivateBallot />` → `<VoteReceipt />`
- Live vote count (number of votes cast, NOT the tally)

**Page 2: Closed vote**  
- Shows the same proposal after deadline
- `<VoteResult />` with full tally
- Link to verify your receipt

**Page 3: Admin**
- `<VoteAdmin />` to deploy a new vote

---

## Aztec SDK integration

Use `@aztec/aztec.js` and `@aztec/noir-contracts.js`.

```typescript
// Connect to Aztec Alpha Network
import { createPXEClient, AztecAddress } from '@aztec/aztec.js'

const pxe = await createPXEClient('https://api.aztec.network/alpha')

// Deploy the voting contract
const votingContract = await PrivateVotingContract.deploy(
  wallet,
  voteConfig
).send().deployed()

// Cast a vote
await votingContract.methods
  .cast_vote(voteChoice, eligibilityProof, nullifier)
  .send()
  .wait()
```

---

## The `receipt-design.md` document

This is the research contribution — a written explanation of the design decisions behind the receipt UX. Should cover:

1. Why the receipt doesn't show your vote choice (and why that's the feature)
2. The nullifier as an identity-preserving fingerprint
3. How verification works after the vote closes
4. Why "Download receipt" matters (users need to save it before they can verify)
5. Plain-language descriptions that passed user comprehension testing (if we run any)
6. The open questions we didn't solve

---

## README structure

```markdown
# Aztec Private Voting

Private ballot infrastructure for DAOs. Four React components + Aztec Noir contracts.

## What this is
A voting primitive for DAOs that want secret ballots with verifiable tallies.
Members vote privately — only the final result is revealed.

## What this is not
- A full governance platform (use Tally, Boardroom, or Snapshot for that)
- A replacement for public voting in all cases
- Production-ready (this is research code)

## The receipt problem
The hardest part of private voting UX is the receipt...
[link to docs/receipt-design.md]

## Install
npm install @aztec/private-voting

## Usage
[code example with all four components]

## Contracts
[Aztec Alpha Network deployment addresses]

## Grant
Built with support from Aztec Grants. If you're building governance tooling,
reach out — we're interested in integrations.
```

---

## Definition of done

- [ ] `voting.nr` contract compiles and deploys to Aztec Alpha testnet
- [ ] `cast_vote` creates an encrypted ballot, nullifier stored
- [ ] `finalize_vote` reveals correct tally after deadline
- [ ] `verify_vote_counted` returns true for cast nullifiers
- [ ] All four React components render correctly
- [ ] `<VoteReceipt />` clearly explains what the fingerprint is and how to verify
- [ ] Demo app runs locally with a complete vote flow
- [ ] README explains the receipt design decisions
- [ ] `docs/receipt-design.md` written

---

## Claude Code prompt

~~~
Build the Aztec private voting MVP.

New repo: jonybur/aztec-private-voting

Full spec in this file (VON-70-aztec-private-voting-spec.md).

Priority order:
1. Scaffold the repo structure
2. Write voting.nr Noir contract (compile with nargo)
3. Build the four React components — start with VoteReceipt (the key UX piece)
4. Wire up Aztec SDK in useVote.ts hook
5. Build the demo app
6. Write docs/receipt-design.md

Use Aztec Alpha Network for deployment.
Aztec SDK: @aztec/aztec.js
Noir: latest version via nargo

The receipt UX is the research contribution — spend time getting the copy right.
"Your vote fingerprint" not "nullifier". "How to verify" not "cryptographic proof".
Plain language throughout.

Push to branch main on the new repo jonybur/aztec-private-voting.
~~~
