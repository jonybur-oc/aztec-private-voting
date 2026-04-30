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
