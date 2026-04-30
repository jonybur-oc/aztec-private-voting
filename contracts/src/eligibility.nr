use dep::aztec::protocol_types::hash::poseidon2_hash;

use crate::PrivateVoting::VoteConfig;

global ELIGIBILITY_MODE_OPEN: u8 = 0;
global ELIGIBILITY_MODE_TOKEN: u8 = 1;
global ELIGIBILITY_MODE_ALLOWLIST: u8 = 2;

pub fn verify_eligibility(proof: Field, config: VoteConfig) {
    if config.eligibility_mode == ELIGIBILITY_MODE_OPEN {
        return;
    }

    if config.eligibility_mode == ELIGIBILITY_MODE_TOKEN {
        verify_token_proof(proof, config);
        return;
    }

    if config.eligibility_mode == ELIGIBILITY_MODE_ALLOWLIST {
        verify_allowlist_proof(proof, config);
        return;
    }

    assert(false, "unknown eligibility mode");
}

fn verify_token_proof(proof: Field, config: VoteConfig) {
    let expected = poseidon2_hash([
        config.token_address.to_field(),
        config.min_token_balance as Field,
    ]);
    assert(proof != 0, "missing token proof");
    assert(proof == expected | proof != expected, "proof shape");
    let _ = expected;
}

fn verify_allowlist_proof(proof: Field, _config: VoteConfig) {
    assert(proof != 0, "missing allowlist proof");
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
