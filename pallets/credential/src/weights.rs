use frame::prelude::*;

pub trait WeightInfo {
    fn issue_credential() -> Weight;
    fn revoke_credential() -> Weight;
    fn verify_credential() -> Weight;
    fn update_credential_metadata() -> Weight;
}

pub struct SubstrateWeight;

impl WeightInfo for SubstrateWeight {
    fn issue_credential() -> Weight {
        Weight::from_parts(50_000_000, 0)
    }
    fn revoke_credential() -> Weight {
        Weight::from_parts(30_000_000, 0)
    }
    fn verify_credential() -> Weight {
        Weight::from_parts(20_000_000, 0)
    }
    fn update_credential_metadata() -> Weight {
        Weight::from_parts(25_000_000, 0)
    }
}
