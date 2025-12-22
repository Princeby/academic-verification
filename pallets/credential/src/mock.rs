use crate as credential;
use frame::prelude::*;
use frame::testing_prelude::*;

type Block = frame_system::mocking::MockBlock<Test>;

// Configure a mock runtime to test the pallet
#[frame_construct_runtime]
mod runtime {
    #[runtime::runtime]
    #[runtime::derive(
        RuntimeCall,
        RuntimeEvent,
        RuntimeError,
        RuntimeOrigin,
        RuntimeFreezeReason,
        RuntimeHoldReason,
        RuntimeSlashReason,
        RuntimeLockId,
        RuntimeTask
    )]
    pub struct Test;

    #[runtime::pallet_index(0)]
    pub type System = frame_system;

    #[runtime::pallet_index(1)]
    pub type Did = did;

    #[runtime::pallet_index(2)]
    pub type Credential = credential;
}

// System pallet configuration
#[derive_impl(frame_system::config_preludes::TestDefaultConfig)]
impl frame_system::Config for Test {
    type Block = Block;
}

// DID pallet configuration (required by Credential pallet)
parameter_types! {
    pub const MaxDocumentSize: u32 = 1024;
    pub const MaxPublicKeys: u32 = 10;
}

impl did::Config for Test {
    type RuntimeEvent = RuntimeEvent;
    type MaxDocumentSize = MaxDocumentSize;
    type MaxPublicKeys = MaxPublicKeys;
    type WeightInfo = did::weights::SubstrateWeight;
}

// Credential pallet configuration
parameter_types! {
    pub const MaxMetadataSize: u32 = 512;
    pub const MaxCredentialsPerHolder: u32 = 100;
}

impl credential::Config for Test {
    type RuntimeEvent = RuntimeEvent;
    type MaxMetadataSize = MaxMetadataSize;
    type MaxCredentialsPerHolder = MaxCredentialsPerHolder;
    type WeightInfo = credential::weights::SubstrateWeight;
}

// Test externalities initialization
pub fn new_test_ext() -> TestExternalities {
    frame_system::GenesisConfig::<Test>::default()
        .build_storage()
        .unwrap()
        .into()
}

// Helper functions for tests
pub fn create_did_for_account(account: u64) {
    let public_key = [account as u8; 32];
    assert_ok!(Did::create_did(
        RuntimeOrigin::signed(account),
        public_key,
        did::KeyType::Ed25519
    ));
}

pub fn register_institution(account: u64, name: &str) {
    create_did_for_account(account);
    
    let name_bytes: BoundedVec<u8, MaxDocumentSize> = 
        name.as_bytes().to_vec().try_into().unwrap();
    
    assert_ok!(Did::register_institution(
        RuntimeOrigin::signed(account),
        name_bytes
    ));
}

pub fn verify_institution(account: u64) {
    assert_ok!(Did::verify_institution(
        RuntimeOrigin::root(),
        account
    ));
}

pub fn setup_verified_institution(account: u64, name: &str) {
    register_institution(account, name);
    verify_institution(account);
}