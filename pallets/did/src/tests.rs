use crate::{mock::*, Error, Event, KeyType, DidDocuments, Institutions};
use frame::testing_prelude::*;

//CREATE DID TESTS
#[test]
fn create_did_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;
        let public_key = [1u8; 32];

        //Create a DID
        assert_ok!(
            Did::create_did(RuntimeOrigin::signed(account),
            public_key,
            KeyType::Ed25519
        ));

        assert!(DidDocuments::<Test>::contains_key(account));

        System::assert_last_event(
            Event::DidCreated { owner: account }.into(),
        );
    })
}