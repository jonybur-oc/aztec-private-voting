use dep::aztec::protocol_types::traits::{Deserialize, Serialize};

global MAX_OPTIONS: u32 = 8;

#[derive(Serialize, Deserialize)]
pub struct EncryptedTally {
    counters: [u64; 8],
}

impl EncryptedTally {
    pub fn empty() -> Self {
        Self { counters: [0; 8] }
    }

    pub fn reveal(self) -> [u64; 8] {
        self.counters
    }
}

pub fn add_to_tally(tally: EncryptedTally, choice: u8) -> EncryptedTally {
    let mut next = tally.counters;
    let idx = choice as u32;
    assert(idx < MAX_OPTIONS, "choice out of range");
    next[idx] = next[idx] + 1;
    EncryptedTally { counters: next }
}

// APV-33: cast_vote correctly increments the encrypted tally.
#[test]
fn add_to_tally_increments_chosen_slot() {
    let tally = EncryptedTally::empty();
    let after_for = add_to_tally(tally, 0);
    let after_for_again = add_to_tally(after_for, 0);
    let after_against = add_to_tally(after_for_again, 1);
    let revealed = after_against.reveal();
    assert(revealed[0] == 2, "two For votes should land in slot 0");
    assert(revealed[1] == 1, "one Against vote should land in slot 1");
    assert(revealed[2] == 0, "untouched slots stay zero");
}

// APV-35: finalize_vote reveals the tally as written.
#[test]
fn reveal_matches_running_tally() {
    let mut t = EncryptedTally::empty();
    t = add_to_tally(t, 0);
    t = add_to_tally(t, 2);
    t = add_to_tally(t, 2);
    t = add_to_tally(t, 2);
    let revealed = t.reveal();
    assert(revealed[0] == 1, "one vote in slot 0");
    assert(revealed[2] == 3, "three votes in slot 2");
}

// Choice indices outside the tally width must abort.
#[test(should_fail_with = "choice out of range")]
fn add_to_tally_rejects_out_of_range_choice() {
    let tally = EncryptedTally::empty();
    let _ = add_to_tally(tally, 8);
}
