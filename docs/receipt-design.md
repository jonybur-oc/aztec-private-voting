# The receipt UX

The receipt is the moment after a voter clicks "Cast Private Vote." It is the most fragile point in any private voting system: the user just did something irreversible, and they need to walk away believing two things at once -

1. My vote was counted.
2. Nobody (not even the system) knows how I voted.

These claims look contradictory until you see the receipt. The receipt is what makes them coherent. This document explains how we designed it.

## What every existing system gets wrong

Look at every shipped private voting system today. The "receipt" is one of three things:

- **A transaction hash** (`0x9a4f2b...`). True, but unreadable. Most users have no idea what to do with it.
- **A "your vote has been recorded" toast.** Comforting, but proves nothing. It's the system asking the user to trust it.
- **A cryptographic proof artifact.** Real, but written for protocol engineers. The first paragraph mentions "nullifier" or "Merkle witness" and the user closes the tab.

None of these communicate what actually happened. The voter is left with either blind trust or a hex string they can't act on. We wanted neither.

## What the receipt has to do

We held the receipt to four jobs, in order of priority:

1. **Confirm the vote was cast.** The voter just did the thing - the receipt has to say so before anything else.
2. **Explain that the choice is private.** Not in fine print. In the body of the receipt.
3. **Give the voter something they can save.** The receipt is theirs, not the system's.
4. **Tell them how to verify, later.** Without making them do it now.

If the receipt only does (1), it's a toast. If it does (1) + (3) without (2), the voter assumes the receipt contains the choice. If it does (4) without (2), the voter doesn't know why verification matters.

## The fingerprint, not the nullifier

The receipt's center of gravity is a single hex value. In the protocol layer, this is a nullifier - a hash derived from `(voteId, voterSecret)` that makes double-voting detectable without revealing identity.

We do not call it a nullifier in the UI.

We call it a **vote fingerprint**. The reason is straightforward: `nullifier` is jargon, and worse, the word `null` carries the implication that the vote was nullified - the opposite of what the value actually proves. Voters shown the word "nullifier" in usability tests of comparable systems consistently misread it as something bad.

`Fingerprint` carries the right model: it's something unique to your vote, you can match it later, and showing yours doesn't reveal anything about anyone else's. The metaphor isn't perfect (a fingerprint identifies a person, this one specifically does not identify the voter), but it gets the user to the right behavior - "save this, check it later" - faster than any technically correct term we tried.

## Why the receipt does not contain your vote

This was the contentious decision. Every reviewer we showed early drafts to asked: "Shouldn't the receipt say which option I picked? Otherwise how do I know?"

The answer is: the receipt does not contain your vote, and that is the feature.

If the receipt contained your choice, then anyone who could obtain the receipt would know your choice. Coercion attacks (someone forcing you to vote a particular way and demanding the receipt as proof) become trivial. Vote-buying becomes trivial. The entire reason for private voting collapses into a sticker that says "private."

The voter remembers their own choice. The system remembers the tally. The receipt connects the two through a fingerprint that proves *a vote was counted* without proving *which one*.

The UI says this in plain language:

> This fingerprint proves your vote was counted without revealing how you voted.

That sentence is the most-edited single line in the codebase.

## How verification works

The "How to verify" affordance is collapsed by default. We opened it on first prototypes and the receipt felt loud and bureaucratic; voters skimmed past it. Collapsed, it acts as a second-pass tool: the voter sees the receipt, files it away, and comes back when they need it.

When expanded, it gives a three-step explainer:

1. Save the receipt now (it's only stored on your device).
2. When the vote closes, open the verifier.
3. Paste your fingerprint. The verifier will tell you whether it was counted.

This works because verification is a public function on the contract: `verify_vote_counted(nullifier) -> bool`. Pasting the fingerprint queries the contract and returns whether that nullifier is in the set of counted votes. It does not reveal the choice. The verifier UI is built into `<VoteResult />`.

## Download is not optional

The receipt offers a "Download receipt" button as the primary action. This was originally a secondary action and we promoted it after watching one usability session: a voter who was happy with the on-screen receipt closed the tab, then realized two minutes later they had no record of the fingerprint.

Download writes a JSON file containing:

```json
{
  "version": 1,
  "kind": "aztec-private-voting-receipt",
  "voteId": "...",
  "voteTitle": "...",
  "nullifier": "0x...",
  "txHash": "0x...",
  "timestamp": 1714238400000,
  "contractAddress": "0x..."
}
```

The file does not contain the choice. It does not contain the voter's address. It contains exactly what the voter needs to verify, later, on their own.

We considered emailing the receipt. We rejected it: email is the worst possible storage for a value whose privacy depends on it not appearing in a place the voter doesn't control. The download is intentional friction.

## Copy notes

A few specific phrasings we landed on, and the alternatives we rejected:

- **"Your vote was cast"** - rejected: "Your ballot has been recorded" (too official), "Vote submitted!" (too casual, and the exclamation mark felt like the system was relieved).
- **"Your vote fingerprint"** - rejected: "Your nullifier" (jargon), "Receipt ID" (implies the receipt is the system's record), "Vote token" (implies fungibility).
- **"This fingerprint proves your vote was counted without revealing how you voted."** - rejected: anything containing "cryptographic," "zero-knowledge," "proof," or "encrypted." All of those are true; none of them are what the voter needs to know in this moment.
- **"How to verify"** - rejected: "Cryptographic proof," "Verification details," "Audit trail." The first asks the voter to do something; the others ask the voter to read something.

## Related work

The design decisions in this document did not emerge in isolation. Several lines of prior work informed them.

**Receipt-freeness as a formal property.** Benaloh and Tuinstra (1994) defined receipt-freeness: a voting scheme is receipt-free if a voter cannot prove to a third party how they voted, even if they want to. This is the formal property we are trying to support in UX. The vote fingerprint is designed to satisfy the Benaloh/Tuinstra definition — it proves a vote was cast and counted, but not the choice. The current implementation relies on the Aztec network's privacy guarantees at the protocol layer; we are not claiming to have proven receipt-freeness independently.

**Usability in verifiable election systems.** The work around Helios (Adida et al., 2008) and STAR-Vote (Bell et al., 2013) established the central tension: systems with strong cryptographic audit trails are difficult for voters to understand, and the parts voters most want to understand ("was my vote counted?") are least accessible in technically correct outputs. Our approach — collapsing verification by default, renaming the nullifier, prioritizing the one-sentence claim — is a direct response to the comprehension failures documented in usability studies of Helios.

**Mental models in security UIs.** Whitten and Tygar's "Why Johnny Can't Encrypt" (1999) and the follow-on body of work on security usability (Cranor and Garfinkel, 2005) established that technically correct feedback that violates users' mental models is effectively no feedback. The decision to avoid "cryptographic," "zero-knowledge," and "nullifier" in the receipt copy comes directly from this tradition.

**Human-centered AI design principles.** Amershi et al.'s "Guidelines for Human-AI Interaction" (CHI 2019) includes the principle that AI and automated systems should make clear what they did and why, using language the user can act on. The receipt's primary job — "your vote was counted; here is how to verify it later" — is an application of this principle to a cryptographic system where the "action" is the ZK proof and the "why" is receipt-freeness.

**Coercion in blockchain governance.** Kelkar et al.'s work on front-running and ordering manipulation in Ethereum (2020) and subsequent analysis of MEV in governance contexts established that on-chain governance is more susceptible to coercion than off-chain equivalents. The receipt design explicitly does not solve concurrent observation coercion (see Open Questions), but the download-by-default and no-choice-in-receipt decisions address the most common after-the-fact coercion vector ("show me your receipt").

## Open questions

These are things we did not solve in the MVP and would want to address before any production deployment.

1. **Receipt loss.** If a voter loses their receipt, they cannot verify their own vote was counted - they can only trust the public tally. Some systems offer a key-derivation approach where the receipt can be regenerated from the voter's wallet seed. We have not implemented this; there are real tradeoffs (regeneration also gives a coercer a path).
2. **Coercion at the UI layer.** The receipt does not contain the choice, but the browser session does (briefly, in memory). A determined coercer with shoulder-surfing access during the vote sees the choice. The receipt mitigates after-the-fact coercion, not concurrent observation.
3. **Verification UX after vote close.** The current flow requires the voter to come back and paste their fingerprint. We have not tested whether voters actually do this. If most voters never verify, the receipt's value is mostly psychological. That may be fine. We should measure.
4. **Plain-language testing at scale.** The copy decisions in this document are based on a handful of internal reviews. Before any real DAO uses this, we would want comprehension testing with non-technical voters - particularly around the "fingerprint" metaphor and the "doesn't reveal your vote" claim, both of which are load-bearing.
5. **Receipt and accessibility.** The receipt is a `<div role="region">` with labeled controls, but we have not tested it with screen readers in any depth. The hex fingerprint in particular is read character-by-character by default, which is correct for verification but tedious for confirmation. A `aria-label` with a phonetic chunking might be better.

## What we'd build next

If we keep working on this past the MVP:

- A printable receipt format (some voters - particularly in DAO contexts that overlap with traditional governance - want paper).
- An iOS/Android share-sheet integration so the receipt lands in the voter's preferred storage (Notes, Files, password manager).
- A verifier widget that any DAO frontend can embed, decoupled from this component library, so that a voter who used `<PrivateBallot />` on one site can verify on a different one.
- A version of the receipt that survives the contract being upgraded or migrated. Currently the receipt is bound to the contract address at the time of voting; if the contract is replaced, old receipts can no longer be verified. There are protocol-level ways to address this; we did not.
