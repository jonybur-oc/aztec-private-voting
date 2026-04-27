# Aztec Private Voting — User Stories
_The contract for what this project needs to do. Organised by role and priority._
_Status: v1.0 — April 2026_

---

## Roles

- **Voter** — a DAO member casting a private ballot
- **Facilitator** — the person setting up and running the vote
- **Auditor** — anyone verifying the vote was conducted correctly
- **Developer** — integrating this library into a DAO frontend

---

## Core (must work before any real use)

### Voter — casting a vote

**APV-01** As a voter, I can connect my wallet and prove I am eligible to vote without revealing my wallet address to other voters.

**APV-02** As a voter, I can see the vote proposal title, description, and available options before deciding.

**APV-03** As a voter, I can select one option and submit my encrypted ballot.

**APV-04** As a voter, I receive a receipt immediately after voting that shows my vote fingerprint, the transaction hash, and the timestamp.

**APV-05** As a voter, the receipt explains in plain language that my vote was counted without revealing my choice.

**APV-06** As a voter, I can download my receipt as a JSON file for safekeeping.

**APV-07** As a voter, I cannot vote twice in the same proposal (double-vote protection enforced on-chain).

**APV-08** As a voter, I cannot vote after the deadline has passed.

### Voter — verifying after the vote closes

**APV-09** As a voter, I can paste my vote fingerprint into a verifier and confirm it was counted.

**APV-10** As a voter, the verifier does not reveal how I voted — only that my fingerprint is in the set of counted votes.

**APV-11** As a voter, I can access the verifier from the closed vote page without needing to log in.

### Facilitator — setting up a vote

**APV-12** As a facilitator, I can configure a vote with a title, description, and up to 8 options.

**APV-13** As a facilitator, I can set eligibility to one of: open to any wallet, token-gated (minimum balance), or an allowlist of addresses.

**APV-14** As a facilitator, I can set start and end times for the vote.

**APV-15** As a facilitator, I can set a quorum (minimum number of votes for the result to be valid).

**APV-16** As a facilitator, I can deploy the vote contract from the admin UI without writing any code.

**APV-17** As a facilitator, I can see a live count of how many votes have been cast (not the tally — just the count).

**APV-18** As a facilitator, I can finalize the vote after the deadline to reveal the tally.

### Auditor — verifying the result

**APV-19** As an auditor, I can verify that the final tally was computed correctly using the on-chain proof.

**APV-20** As an auditor, I can see the total number of votes cast and confirm it matches the tally.

**APV-21** As an auditor, I cannot determine how any individual voter voted.

**APV-22** As an auditor, I can verify that no address voted twice.

### Developer — integrating the library

**APV-23** As a developer, I can install `@aztec/private-voting` and render a complete vote flow with four component imports.

**APV-24** As a developer, the components work with an Aztec wallet (e.g. Aztec's own wallet provider) out of the box.

**APV-25** As a developer, I can customise the styling of all components via CSS custom properties or className overrides.

**APV-26** As a developer, the library exports TypeScript types for all props and return values.

---

## Quality (needed for stability and grant application)

### End-to-end tests

**APV-27** The full voter flow (connect → prove eligibility → cast vote → receive receipt → download) is covered by an automated e2e test using Playwright or Cypress.

**APV-28** The double-vote protection is tested: the same wallet cannot vote twice in the same proposal.

**APV-29** The deadline enforcement is tested: a vote after the end time is rejected.

**APV-30** The tally finalization is tested: after finalize_vote, the correct result is publicly readable.

**APV-31** The verifier is tested: a valid fingerprint returns true, an invalid one returns false.

**APV-32** The receipt download is tested: the downloaded JSON contains the correct fields and no vote choice.

### Contract tests (Noir unit tests)

**APV-33** `cast_vote` correctly increments the encrypted tally.

**APV-34** `cast_vote` rejects a nullifier that has already been used.

**APV-35** `finalize_vote` correctly decrypts and reveals the final tally.

**APV-36** `verify_vote_counted` returns true for a nullifier in the set and false for one not in the set.

**APV-37** The eligibility proof correctly rejects addresses below the minimum token balance.

### Error states

**APV-38** As a voter, if eligibility checking fails (network error), I see a clear error message and a retry option — not a blank screen.

**APV-39** As a voter, if my ballot submission fails (transaction rejected), I see a plain-language explanation and can try again without losing my selected option.

**APV-40** As a voter, if I try to vote after the deadline, I see a clear message explaining the vote is closed.

**APV-41** As a facilitator, if deployment fails, I see the error and the state of my configuration is preserved.

---

## Nice to have (post-MVP, before production)

**APV-42** As a voter, if I lose my receipt, I can regenerate the fingerprint from my wallet seed (key derivation from voteId + wallet secret).

**APV-43** As a voter, I can share my receipt directly to my iOS/Android Files app or password manager via the share sheet.

**APV-44** As a developer, the verifier widget is published as a standalone embed so any DAO can add "verify your vote" to their frontend without using the full component library.

**APV-45** As a voter, the receipt is accessible: the fingerprint is readable by screen readers in a sensible format (not character-by-character).

**APV-46** As a facilitator, I can export a PDF of the vote results suitable for a governance report.

**APV-47** As a developer, I can connect the library to any Snapshot-compatible proposal via a Snapshot plugin adapter.

**APV-48** As a facilitator, I can set delegation: eligible voters can delegate their vote weight to another address privately.

---

## Out of scope (explicitly not building now)

- Forum or discussion features — handled by adjacent tools (Discourse, Snapshot, etc.)
- Full governance platform — this is a primitive, not a platform
- Cross-chain voting — Aztec L2 only
- Mobile native apps — web only
- Voter anonymity from the facilitator — the facilitator can see vote count but not choices; full trustless setup (threshold decryption) is future work

---

## Definition of done for grant application

The following stories must be passing before applying to Aztec Grants:

**Core:** APV-01 through APV-26 (all core stories working in the demo app)
**Quality:** APV-27 through APV-41 (all e2e and contract tests passing)
**Deployed:** Contract live on Aztec Alpha testnet with a public address
**Documented:** `receipt-design.md` complete, README accurate and runnable

Nice-to-haves (APV-42+) are explicitly not required.
