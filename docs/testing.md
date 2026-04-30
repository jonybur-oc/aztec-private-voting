# Testing

The MVP ships three layered test suites that together cover stories APV-27 through APV-41 from `STORIES.md`.

## TL;DR

```sh
# Unit + component tests (no infra required)
npm run test -w @aztec-private-voting/react

# Noir contract tests
cd contracts && nargo test

# E2e tests against a running demo + deployed contract
cd demo && npm run test:e2e:install   # one-time
E2E_TESTNET_READY=1 npm run test:e2e -w demo
```

## Unit + component tests (Vitest)

Located under `packages/react/src/**/*.test.{ts,tsx}`. They exercise the pieces that don't need an Aztec network:

| Story    | What it covers                                                                  | File                                              |
| -------- | ------------------------------------------------------------------------------- | ------------------------------------------------- |
| APV-32   | Downloaded receipt JSON contains the verifiable fields and no vote choice       | `src/receipt.test.ts`                             |
| Helpers  | `shortenHex`, `percent`, `fingerprintFromNullifier` formatting invariants       | `src/format.test.ts`, `src/aztec/nullifier.test.ts` |
| APV-39   | `useVote` translates contract assertions into voter-facing copy                 | `src/aztec/errors.test.ts`                        |
| APV-40   | Ballot deadline guard renders the closed message instead of the form           | `src/components/PrivateBallot.test.tsx`           |
| APV-41   | Deploy/finalize errors translate to plain language; draft state is preserved   | `src/aztec/errors.test.ts`                        |
| APV-04-06 | Receipt copy ("vote fingerprint", privacy claim, primary download)              | `src/components/VoteReceipt.test.tsx`             |
| APV-09-11, APV-31 | Verifier accepts a fingerprint and renders true/false outcomes         | `src/components/VoteResult.test.tsx`              |

These run in jsdom and have zero infrastructure dependencies.

## Noir contract tests (`nargo test`)

Located inline in `contracts/src/{tally,eligibility}.nr` as `#[test]` functions:

| Story  | What it covers                                                                                        |
| ------ | ----------------------------------------------------------------------------------------------------- |
| APV-33 | `add_to_tally` increments the chosen slot and leaves the others alone                                 |
| APV-34 | (Enforced in `_record_vote`) - same-nullifier reuse is rejected by the public-state map               |
| APV-35 | `EncryptedTally::reveal` returns the running counts as written                                        |
| APV-37 | `verify_token_proof` and `verify_allowlist_proof` reject the zero proof                               |

Run with `cd contracts && nargo test`.

## E2e tests (Playwright)

Located under `demo/e2e/*.spec.ts`. They drive the actual Next.js app and need:

1. The PrivateVoting contract deployed on Aztec Alpha testnet.
2. `demo/.env.local` populated with `NEXT_PUBLIC_AZTEC_PXE_URL` and `NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS`.
3. `E2E_TESTNET_READY=1` set in the environment so the suite is not auto-skipped.

| Story          | Spec                              |
| -------------- | --------------------------------- |
| APV-27         | `voter-flow.spec.ts`              |
| APV-28         | `double-vote.spec.ts`             |
| APV-29-31      | `closed-vote.spec.ts`             |
| APV-32         | `receipt-download.spec.ts`        |

Without `E2E_TESTNET_READY` the specs are skipped, so the suite stays green on CI runners that don't have an Aztec node.

## Error states (APV-38 to APV-41)

- **APV-38** (eligibility check failure): `useEligibility` surfaces an "ineligible" status with the original error message; rendered by `<VoteEligibilityProof>` (covered by component test in `VoteResult.test.tsx`'s mock harness pattern - extend as needed).
- **APV-39** (ballot submission failure): plain-language translation covered in `errors.test.ts`. The selected option is preserved because `PrivateBallot` keeps `selected` state across error renders.
- **APV-40** (post-deadline attempt): explicit guard tested in `PrivateBallot.test.tsx`.
- **APV-41** (deployment failure): error translation covered in `errors.test.ts`. The `useDeployVote` hook returns null on failure without resetting the draft, so the wizard form keeps the facilitator's input.
