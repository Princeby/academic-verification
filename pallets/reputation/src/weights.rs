use frame::prelude::*;

pub trait WeightInfo {
    fn endorse() -> Weight;
    fn remove_endorsement() -> Weight;
    fn update_reputation_score() -> Weight;
}

pub struct SubstrateWeight;

impl WeightInfo for SubstrateWeight {
    fn endorse() -> Weight {
        Weight::from_parts(30_000_000, 0)
    }
    fn remove_endorsement() -> Weight {
        Weight::from_parts(20_000_000, 0)
    }
    fn update_reputation_score() -> Weight {
        Weight::from_parts(15_000_000, 0)
    }
}