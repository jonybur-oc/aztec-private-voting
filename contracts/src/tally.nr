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
