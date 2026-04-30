use crate::PrivateVoting::VoteConfig;

global ELIGIBILITY_MODE_OPEN: u8 = 0;
global ELIGIBILITY_MODE_TOKEN: u8 = 1;
global ELIGIBILITY_MODE_ALLOWLIST: u8 = 2;

// Verifies the proof shape for the configured eligibility mode. Open votes
// accept anything; token-gated and allowlist votes require a non-zero proof
// witness (the React layer derives this from the gating data). Production
// deployments would replace these placeholder checks with a constraint that
// the proof equals the expected commitment for the gating config.
pub fn verify_eligibility(proof: Field, config: VoteConfig) {
    if config.eligibility_mode == ELIGIBILITY_MODE_OPEN {
        // any proof accepted
    } else if config.eligibility_mode == ELIGIBILITY_MODE_TOKEN {
        assert(proof != 0, "missing token proof");
    } else if config.eligibility_mode == ELIGIBILITY_MODE_ALLOWLIST {
        assert(proof != 0, "missing allowlist proof");
    } else {
        assert(false, "unknown eligibility mode");
    }
}

// APV-37: an empty (zero) proof is rejected for token-gated votes.
#[test(should_fail_with = "missing token proof")]
fn token_proof_rejects_zero() {
    let config = VoteConfig {
        title_hash: 0,
        options_count: 2,
        start_time: 0,
        end_time: 1,
        quorum: 1,
        eligibility_mode: ELIGIBILITY_MODE_TOKEN,
        token_address: dep::aztec::prelude::AztecAddress::from_field(0xabc),
        min_token_balance: 1,
    };
    verify_token_proof(0, config);
}

// APV-37: an empty (zero) proof is rejected for allowlist votes.
#[test(should_fail_with = "missing allowlist proof")]
fn allowlist_proof_rejects_zero() {
    let config = VoteConfig {
        title_hash: 0,
        options_count: 2,
        start_time: 0,
        end_time: 1,
        quorum: 1,
        eligibility_mode: ELIGIBILITY_MODE_ALLOWLIST,
        token_address: dep::aztec::prelude::AztecAddress::from_field(0),
        min_token_balance: 0,
    };
    verify_allowlist_proof(0, config);
}

// Open eligibility passes for any (including zero) proof - the contract layer
// performs no membership check.
#[test]
fn open_eligibility_accepts_anything() {
    let config = VoteConfig {
        title_hash: 0,
        options_count: 2,
        start_time: 0,
        end_time: 1,
        quorum: 1,
        eligibility_mode: ELIGIBILITY_MODE_OPEN,
        token_address: dep::aztec::prelude::AztecAddress::from_field(0),
        min_token_balance: 0,
    };
    verify_eligibility(0, config);
    verify_eligibility(0xdeadbeef, config);
}
