// pallets/did/src/weights.rs
use frame::prelude::*;

pub trait WeightInfo {
    fn create_did() -> Weight;
    fn add_public_key() -> Weight;
    fn remove_public_key() -> Weight;
    fn deactivate_did() -> Weight;
    fn reactivate_did() -> Weight;
    fn register_institution() -> Weight;
    fn verify_institution() -> Weight;
    fn revoke_institution() -> Weight;
}

pub struct SubstrateWeight;

impl WeightInfo for SubstrateWeight {
    fn create_did() -> Weight {
        Weight::from_parts(10_000_000, 0)
    }
    fn add_public_key() -> Weight {
        Weight::from_parts(15_000_000, 0)
    }
    fn remove_public_key() -> Weight {
        Weight::from_parts(12_000_000, 0)
    }
    fn deactivate_did() -> Weight {
        Weight::from_parts(10_000_000, 0)
    }
    fn reactivate_did() -> Weight {
        Weight::from_parts(10_000_000, 0)
    }
    fn register_institution() -> Weight {
        Weight::from_parts(15_000_000, 0)
    }
    fn verify_institution() -> Weight {
        Weight::from_parts(10_000_000, 0)
    }
    fn revoke_institution() -> Weight {
        Weight::from_parts(10_000_000, 0)
    }
}
