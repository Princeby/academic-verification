use crate as reputation;
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

    #[runtime::pallet_index(3)]
    pub type Reputation = reputation;
}

// System pallet configuration
#[derive_impl(frame_system::config_preludes::TestDefaultConfig)]
impl frame_system::Config for Test {
    type Block = Block;
}

// DID pallet configuration
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

// Reputation pallet configuration
parameter_types! {
    pub const MaxEndorsements: u32 = 50;
    pub const MaxCommentSize: u32 = 256;
}

impl reputation::Config for Test {
    type RuntimeEvent = RuntimeEvent;
    type MaxEndorsements = MaxEndorsements;
    type MaxCommentSize = MaxCommentSize;
    type WeightInfo = reputation::weights::SubstrateWeight;
}

// Test externalities initialization
pub fn new_test_ext() -> TestExternalities {
    frame_system::GenesisConfig::<Test>::default()
        .build_storage()
        .unwrap()
        .into()
}

// ================== Helper Functions ==================

/// Create a DID for an account
pub fn create_did_for_account(account: u64) {
    let public_key = [account as u8; 32];
    assert_ok!(Did::create_did(
        RuntimeOrigin::signed(account),
        public_key,
        did::KeyType::Ed25519
    ));
}

/// Register an institution
pub fn register_institution(account: u64, name: &str) {
    create_did_for_account(account);
    
    let name_bytes: BoundedVec<u8, MaxDocumentSize> = 
        name.as_bytes().to_vec().try_into().unwrap();
    
    assert_ok!(Did::register_institution(
        RuntimeOrigin::signed(account),
        name_bytes
    ));
}

/// Verify an institution (root only)
pub fn verify_institution(account: u64) {
    assert_ok!(Did::verify_institution(
        RuntimeOrigin::root(),
        account
    ));
}

/// Setup a verified institution with DID
pub fn setup_verified_institution(account: u64, name: &str) {
    register_institution(account, name);
    verify_institution(account);
}

/// Create an endorsement with default parameters
pub fn create_test_endorsement(endorser: u64, endorsee: u64) {
    create_did_for_account(endorser);
    create_did_for_account(endorsee);

    let comment: BoundedVec<u8, ConstU32<256>> = 
        b"Great institution!".to_vec().try_into().unwrap();

    assert_ok!(Reputation::endorse(
        RuntimeOrigin::signed(endorser),
        endorsee,
        reputation::EndorsementType::Professional,
        comment,
        5
    ));
}