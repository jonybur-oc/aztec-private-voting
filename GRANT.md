# Aztec Grants Wave 3 — Application

**Project:** Aztec Private Voting  
**Repo:** github.com/jonybur-oc/aztec-private-voting  
**Asking:** $25,000  
**Category:** Tooling + HCI research

---

## What this is

Private ballot infrastructure for DAOs. A Noir contract + four React components that handle the full voter lifecycle: eligibility proof, ballot submission, receipt, result verification, and facilitator tooling.

## The differentiator

The receipt.

Every existing private voting system — MACI, Shutter, the NounsDAO Aztec experiment — hands the voter a hex string or a "your vote was recorded" toast. Neither communicates what actually happened. The voter is left with either blind trust or a transaction hash they can't act on.

We treated the receipt as the product.

After a voter casts a private ballot, they get a `<VoteReceipt />` component built around one design principle: prove the vote was counted without proving how the voter voted. The receipt uses a "vote fingerprint" (the nullifier, renamed for comprehension), download-by-default persistence, a collapsed verification explainer, and copy written to avoid the words "cryptographic," "zero-knowledge," and "nullifier."

The full design rationale — including the specific copy decisions, the alternatives we rejected, and the open problems we did not solve — is in [`docs/receipt-design.md`](docs/receipt-design.md). This is the research contribution nobody else has made. The Noir contract and React components are table stakes for the category; the receipt design is what makes private voting legible to non-technical DAO participants.

---

## Technical state

**Implementation complete.** All Noir contracts + React components are merged and tested.

| Layer | Status |
|---|---|
| `PrivateVoting.nr` — Noir contract (Aztec-NR v4.3) | ✅ merged |
| `@aztec-private-voting/react` — component library | ✅ merged |
| Playwright + Noir unit tests (41 user stories) | ✅ merged |
| Aztec-NR v4.3.0 port | ✅ merged |
| Alpha testnet deployment | ⏳ pending (v4 vulnerability disclosure — deploying when v5 ships in July) |

The contracts compile against Aztec-NR v4.3.0-nightly.20260429. The v4 vulnerability (March 2026 disclosure, patch in v5, July 2026) means we are not deploying real-fund contracts to production yet. The testnet demo works; production deployment targets v5.

---

## Contracts (PrivateVoting.nr)

```
constructor(admin, VoteConfig)          public initializer
cast_vote(choice, eligibility_proof, nullifier)  private → enqueues record_vote
record_vote(...)                        public, only_self — validates timing, eligibility, nullifier, increments tally
finalize_vote()                         public, post-deadline, checks quorum
verify_vote_counted(nullifier) -> bool  public view, reads nullifier map
get_vote_count(), get_final_tally(idx), is_finalized(), get_config()  public views
```

Eligibility modes: open (anyone), token-gated (balance proof), allowlist (merkle witness).

---

## Components

```
<VoteEligibilityProof />   generates a ZK proof of voting rights, silent on happy path
<PrivateBallot />          the vote interface — submits encrypted ballot
<VoteReceipt />            the key piece — plain-language receipt with vote fingerprint
<VoteResult />             tally reveal with verifier for individual fingerprints
<VoteAdmin />              configuration UI for governance facilitators
```

---

## Why Aztec

I was on the team that built zk.money. Aztec's programmable privacy is the right layer — it's the only EVM-adjacent environment where you can genuinely hide vote choice on-chain while keeping tallies public and verifiable.

---

## The live case study

The rsETH/KelpDAO exploit ($71M frozen, Arbitrum governance vote in progress as of May 2026). A 49-day public vote on politically explosive loss socialization, with state-actor-adjacent threat actors watching every wallet. This is the exact context where ballot privacy is not a nice-to-have. Voters who can be identified will be pressured. The current governance tooling has no answer for this.

---

## Budget breakdown ($25K)

| Line | Amount |
|---|---|
| Development — Noir contract + 4 React components + test suite (~3 months part-time at fair market rate) | $15,000 |
| Security review / Noir contract audit before v5 production deployment | $8,000 |
| Documentation, demos, ecosystem tooling | $2,000 |
| **Total** | **$25,000** |

This is calibrated as a tooling + research grant. Wave 2 tooling grants ranged $10K–$30K; this project has completed implementation (not speculative), a differentiated HCI research angle, and a working demo. $25K is the correct ask for this tier.

---

## Competitive landscape

| Project | Cryptography | Product layer | Receipt UX |
|---|---|---|---|
| MACI (EF) | strongest | no product | no |
| Shutter Network | 881 DAOs | simple UX | no (not truly receipt-free) |
| NounsDAO/Aztec experiment | Aztec | proof of concept | no |
| **Aztec Private Voting** | Aztec | DAO-usable | **yes** |

---

## Contact

GitHub: @jonybur-oc  
Discord: ask in Aztec Discord #grants or DM directly  

Built on Aztec-NR. Willing to demo, pair on integrations, or discuss extending the research.
