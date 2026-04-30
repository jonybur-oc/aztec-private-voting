mod eligibility;

use aztec::macros::aztec;

#[aztec]
pub contract PrivateVoting {
    use aztec::macros::{
        functions::{external, initializer, only_self, view},
        storage::storage,
    };
    use aztec::protocol::{address::AztecAddress, traits::{Deserialize, Packable, Serialize}};
    use aztec::state_vars::{Map, PublicImmutable, PublicMutable};

    use crate::eligibility::verify_eligibility;

    global MAX_OPTIONS: u32 = 8;

    #[derive(Eq, Packable, Serialize, Deserialize)]
    pub struct VoteConfig {
        pub title_hash: Field,
        pub options_count: u8,
        pub start_time: u64,
        pub end_time: u64,
        pub quorum: u64,
        pub eligibility_mode: u8,
        pub token_address: AztecAddress,
        pub min_token_balance: u64,
    }

    #[storage]
    struct Storage<Context> {
        admin: PublicImmutable<AztecAddress, Context>,
        config: PublicImmutable<VoteConfig, Context>,
        nullifiers: Map<Field, PublicMutable<bool, Context>, Context>,
        tally: Map<u8, PublicMutable<u64, Context>, Context>,
        vote_count: PublicMutable<u64, Context>,
        is_finalized: PublicMutable<bool, Context>,
    }

    #[external("public")]
    #[initializer]
    fn constructor(admin: AztecAddress, config: VoteConfig) {
        assert(config.options_count > 1, "need at least 2 options");
        assert(config.options_count as u32 <= MAX_OPTIONS, "too many options");
        assert(config.end_time > config.start_time, "end before start");
        self.storage.admin.initialize(admin);
        self.storage.config.initialize(config);
    }

    // Voter casts a private ballot. The choice and the eligibility proof are
    // private witnesses; only the nullifier and the queued tally update are
    // observable on the public side.
    #[external("private")]
    fn cast_vote(vote_choice: u8, eligibility_proof: Field, nullifier: Field) {
        self.enqueue_self.record_vote(vote_choice, eligibility_proof, nullifier);
    }

    // The public half of cast_vote. Validates timing, eligibility, the
    // double-vote guard, and increments the per-option counter.
    #[external("public")]
    #[only_self]
    fn record_vote(vote_choice: u8, eligibility_proof: Field, nullifier: Field) {
        let config = self.storage.config.read();
        assert((vote_choice as u32) < (config.options_count as u32), "invalid choice");

        let now = self.context.timestamp();
        assert(now >= config.start_time, "voting not started");
        assert(now < config.end_time, "voting ended");
        assert(self.storage.is_finalized.read() == false, "already finalized");

        verify_eligibility(eligibility_proof, config);

        let already_used = self.storage.nullifiers.at(nullifier).read();
        assert(already_used == false, "nullifier already used");
        self.storage.nullifiers.at(nullifier).write(true);

        let prev = self.storage.tally.at(vote_choice).read();
        self.storage.tally.at(vote_choice).write(prev + 1);

        let count = self.storage.vote_count.read();
        self.storage.vote_count.write(count + 1);
    }

    #[external("public")]
    fn finalize_vote() {
        let config = self.storage.config.read();
        let now = self.context.timestamp();
        assert(now >= config.end_time, "voting still open");
        assert(self.storage.is_finalized.read() == false, "already finalized");
        assert(self.storage.vote_count.read() >= config.quorum, "quorum not met");
        self.storage.is_finalized.write(true);
    }

    #[external("public")]
    #[view]
    fn verify_vote_counted(nullifier: Field) -> pub bool {
        self.storage.nullifiers.at(nullifier).read()
    }

    #[external("public")]
    #[view]
    fn get_vote_count() -> pub u64 {
        self.storage.vote_count.read()
    }

    #[external("public")]
    #[view]
    fn get_final_tally(option_index: u8) -> pub u64 {
        assert(self.storage.is_finalized.read(), "not finalized");
        self.storage.tally.at(option_index).read()
    }

    #[external("public")]
    #[view]
    fn is_finalized() -> pub bool {
        self.storage.is_finalized.read()
    }

    #[external("public")]
    #[view]
    fn get_config() -> pub VoteConfig {
        self.storage.config.read()
    }
}
