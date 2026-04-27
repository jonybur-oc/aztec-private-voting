mod eligibility;
mod tally;

contract PrivateVoting {
    use dep::aztec::macros::{
        functions::{initializer, internal, private, public, view},
        storage::storage,
    };
    use dep::aztec::prelude::{AztecAddress, Map, PublicMutable};
    use dep::aztec::protocol_types::traits::{Deserialize, Serialize};

    use crate::eligibility::verify_eligibility;
    use crate::tally::{add_to_tally, EncryptedTally};

    global MAX_OPTIONS: u32 = 8;

    #[derive(Serialize, Deserialize)]
    pub struct VoteConfig {
        title_hash: Field,
        options_count: u8,
        start_time: u64,
        end_time: u64,
        quorum: u64,
        eligibility_mode: u8,
        token_address: AztecAddress,
        min_token_balance: u64,
    }

    #[storage]
    struct Storage<Context> {
        admin: PublicMutable<AztecAddress, Context>,
        config: PublicMutable<VoteConfig, Context>,
        nullifiers: Map<Field, PublicMutable<bool, Context>, Context>,
        encrypted_tally: PublicMutable<EncryptedTally, Context>,
        vote_count: PublicMutable<u64, Context>,
        is_finalized: PublicMutable<bool, Context>,
        final_tally: Map<u8, PublicMutable<u64, Context>, Context>,
    }

    #[public]
    #[initializer]
    fn constructor(admin: AztecAddress, config: VoteConfig) {
        assert(config.options_count > 1, "need at least 2 options");
        assert(config.options_count as u32 <= MAX_OPTIONS, "too many options");
        assert(config.end_time > config.start_time, "end before start");
        storage.admin.write(admin);
        storage.config.write(config);
        storage.encrypted_tally.write(EncryptedTally::empty());
        storage.vote_count.write(0);
        storage.is_finalized.write(false);
    }

    #[private]
    fn cast_vote(vote_choice: u8, eligibility_proof: Field, nullifier: Field) {
        let config = storage.config.read();
        assert(vote_choice < config.options_count, "invalid choice");

        verify_eligibility(eligibility_proof, config);

        PrivateVoting::at(context.this_address())
            ._record_vote(nullifier, vote_choice)
            .enqueue(&mut context);
    }

    #[public]
    #[internal]
    fn _record_vote(nullifier: Field, vote_choice: u8) {
        let config = storage.config.read();
        let now = context.timestamp();
        assert(now >= config.start_time, "voting not started");
        assert(now < config.end_time, "voting ended");
        assert(!storage.is_finalized.read(), "already finalized");

        let already_used = storage.nullifiers.at(nullifier).read();
        assert(!already_used, "nullifier already used");
        storage.nullifiers.at(nullifier).write(true);

        let updated = add_to_tally(storage.encrypted_tally.read(), vote_choice);
        storage.encrypted_tally.write(updated);

        let count = storage.vote_count.read();
        storage.vote_count.write(count + 1);
    }

    #[public]
    fn finalize_vote() {
        let config = storage.config.read();
        let now = context.timestamp();
        assert(now >= config.end_time, "voting still open");
        assert(!storage.is_finalized.read(), "already finalized");
        assert(storage.vote_count.read() >= config.quorum, "quorum not met");

        let tally = storage.encrypted_tally.read();
        let revealed = tally.reveal();

        for i in 0..MAX_OPTIONS {
            if i < config.options_count as u32 {
                storage.final_tally.at(i as u8).write(revealed[i]);
            }
        }

        storage.is_finalized.write(true);
    }

    #[public]
    #[view]
    fn verify_vote_counted(nullifier: Field) -> bool {
        storage.nullifiers.at(nullifier).read()
    }

    #[public]
    #[view]
    fn get_vote_count() -> u64 {
        storage.vote_count.read()
    }

    #[public]
    #[view]
    fn get_final_tally(option_index: u8) -> u64 {
        assert(storage.is_finalized.read(), "not finalized");
        storage.final_tally.at(option_index).read()
    }

    #[public]
    #[view]
    fn is_finalized() -> bool {
        storage.is_finalized.read()
    }

    #[public]
    #[view]
    fn get_config() -> VoteConfig {
        storage.config.read()
    }
}
