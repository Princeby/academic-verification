use crate::{mock::*, DidDocuments, Error, Event, Institutions, KeyType};
use frame::testing_prelude::*;

//CREATE DID TESTS
#[test]
fn create_did_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;
        let public_key = [1u8; 32];

        //Create a DID
        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(account),
            public_key,
            KeyType::Ed25519
        ));

        assert!(DidDocuments::<Test>::contains_key(account));

        System::assert_last_event(Event::DidCreated { owner: account }.into());
    })
}

#[test]
fn create_did_fails_if_already_exists() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;
        let public_key = [1u8; 32];

        // Create first DID
        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(account),
            public_key,
            KeyType::Ed25519
        ));

        // Try to create second DID for same account - should fail
        assert_noop!(
            Did::create_did(RuntimeOrigin::signed(account), [2u8; 32], KeyType::Sr25519),
            Error::<Test>::DidAlreadyExists
        );
    });
}

#[test]
fn create_did_stores_correct_data() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;
        let public_key = [1u8; 32];

        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(account),
            public_key,
            KeyType::Ed25519
        ));

        // Verify stored data
        let did_doc = DidDocuments::<Test>::get(account).unwrap();
        assert_eq!(did_doc.controller, account);
        assert_eq!(did_doc.public_keys.len(), 1);
        assert_eq!(did_doc.public_keys[0].public_key, public_key);
        assert_eq!(did_doc.public_keys[0].key_type, KeyType::Ed25519);
        assert_eq!(did_doc.active, true);
        assert_eq!(did_doc.created_at, 1);
        assert_eq!(did_doc.updated_at, 1);
    });
}

#[test]
fn add_public_key_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;
        let first_key = [1u8; 32];
        let second_key = [2u8; 32];

        // Create DID
        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(account),
            first_key,
            KeyType::Ed25519
        ));

        System::set_block_number(2);

        // Add second key
        assert_ok!(Did::add_public_key(
            RuntimeOrigin::signed(account),
            second_key,
            KeyType::Sr25519
        ));

        // Verify key was added
        let did_doc = DidDocuments::<Test>::get(account).unwrap();
        assert_eq!(did_doc.public_keys.len(), 2);
        assert_eq!(did_doc.updated_at, 2);
    });
}

#[test]
fn add_public_key_fails_if_did_not_found() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;
        let public_key = [1u8; 32];

        // Try to add key without creating DID first
        assert_noop!(
            Did::add_public_key(RuntimeOrigin::signed(account), public_key, KeyType::Ed25519),
            Error::<Test>::DidNotFound
        );
    });
}

#[test]
fn add_public_key_fails_if_not_authorized() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let owner = 1u64;
        let attacker = 2u64;
        let public_key = [1u8; 32];

        // Create DID with owner
        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(owner),
            public_key,
            KeyType::Ed25519
        ));

        // Create DID for attacker as well
        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(attacker),
            [3u8; 32],
            KeyType::Ed25519
        ));

        // Manually modify the attacker's DID to point to owner's DID
        // This simulates an authorization attack scenario
        DidDocuments::<Test>::mutate(attacker, |did_doc_opt| {
            if let Some(did_doc) = did_doc_opt {
                // Change controller to owner but keep the DID under attacker's account
                did_doc.controller = owner;
            }
        });

        // Now try to add key - attacker has a DID but is not the controller
        assert_noop!(
            Did::add_public_key(RuntimeOrigin::signed(attacker), [2u8; 32], KeyType::Sr25519),
            Error::<Test>::NotAuthorized
        );
    });
}

#[test]
fn add_public_key_fails_if_did_inactive() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;
        let public_key = [1u8; 32];

        // Create and deactivate DID
        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(account),
            public_key,
            KeyType::Ed25519
        ));

        assert_ok!(Did::deactivate_did(RuntimeOrigin::signed(account)));

        // Try to add key to inactive DID
        assert_noop!(
            Did::add_public_key(RuntimeOrigin::signed(account), [2u8; 32], KeyType::Sr25519),
            Error::<Test>::DidInactive
        );
    });
}

#[test]
fn add_public_key_fails_if_key_already_exists() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;
        let public_key = [1u8; 32];

        // Create DID
        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(account),
            public_key,
            KeyType::Ed25519
        ));

        // Try to add same key again
        assert_noop!(
            Did::add_public_key(RuntimeOrigin::signed(account), public_key, KeyType::Ed25519),
            Error::<Test>::PublicKeyAlreadyExists
        );
    });
}

#[test]
fn add_public_key_fails_if_max_keys_reached() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;

        // Create DID with first key
        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(account),
            [1u8; 32],
            KeyType::Ed25519
        ));

        // Add keys up to the limit (MaxPublicKeys = 10, already have 1)
        for i in 2u8..=10u8 {
            assert_ok!(Did::add_public_key(
                RuntimeOrigin::signed(account),
                [i; 32],
                KeyType::Ed25519
            ));
        }

        // Try to add one more key - should fail
        assert_noop!(
            Did::add_public_key(RuntimeOrigin::signed(account), [11u8; 32], KeyType::Ed25519),
            Error::<Test>::TooManyPublicKeys
        );
    });
}

// ============================================================
// DEACTIVATE/REACTIVATE DID TESTS
// ============================================================

#[test]
fn deactivate_did_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;
        let public_key = [1u8; 32];

        // Create DID
        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(account),
            public_key,
            KeyType::Ed25519
        ));

        System::set_block_number(2);

        // Deactivate DID
        assert_ok!(Did::deactivate_did(RuntimeOrigin::signed(account)));

        // Verify DID is inactive
        let did_doc = DidDocuments::<Test>::get(account).unwrap();
        assert_eq!(did_doc.active, false);
        assert_eq!(did_doc.updated_at, 2);

        // Verify event
        System::assert_last_event(Event::DidDeactivated { owner: account }.into());
    });
}

#[test]
fn reactivate_did_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;
        let public_key = [1u8; 32];

        // Create and deactivate DID
        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(account),
            public_key,
            KeyType::Ed25519
        ));

        assert_ok!(Did::deactivate_did(RuntimeOrigin::signed(account)));

        System::set_block_number(2);

        // Reactivate DID
        assert_ok!(Did::reactivate_did(RuntimeOrigin::signed(account)));

        // Verify DID is active again
        let did_doc = DidDocuments::<Test>::get(account).unwrap();
        assert_eq!(did_doc.active, true);
        assert_eq!(did_doc.updated_at, 2);
    });
}

// ============================================================
// INSTITUTION TESTS
// ============================================================

#[test]
fn register_institution_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;
        let public_key = [1u8; 32];

        // Create DID first
        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(account),
            public_key,
            KeyType::Ed25519
        ));

        // Register as institution
        let name = b"Harvard University".to_vec();
        let bounded_name = name.clone().try_into().unwrap();

        assert_ok!(Did::register_institution(
            RuntimeOrigin::signed(account),
            bounded_name
        ));

        // Verify institution was registered
        assert!(Institutions::<Test>::contains_key(account));

        let institution = Institutions::<Test>::get(account).unwrap();
        assert_eq!(institution.did, account);
        assert_eq!(institution.verified, false);
        assert_eq!(institution.name.to_vec(), name);
    });
}

#[test]
fn register_institution_fails_without_did() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;
        let name = b"Harvard University".to_vec();
        let bounded_name = name.try_into().unwrap();

        // Try to register without DID
        assert_noop!(
            Did::register_institution(RuntimeOrigin::signed(account), bounded_name),
            Error::<Test>::DidNotFound
        );
    });
}

#[test]
fn register_institution_fails_if_already_registered() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;
        let public_key = [1u8; 32];

        // Create DID and register
        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(account),
            public_key,
            KeyType::Ed25519
        ));

        let name = b"Harvard University".to_vec();
        let bounded_name = name.clone().try_into().unwrap();

        assert_ok!(Did::register_institution(
            RuntimeOrigin::signed(account),
            bounded_name
        ));

        // Try to register again
        let bounded_name2 = name.try_into().unwrap();
        assert_noop!(
            Did::register_institution(RuntimeOrigin::signed(account), bounded_name2),
            Error::<Test>::InstitutionAlreadyRegistered
        );
    });
}

#[test]
fn register_institution_fails_with_empty_name() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;
        let public_key = [1u8; 32];

        // Create DID
        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(account),
            public_key,
            KeyType::Ed25519
        ));

        // Try to register with empty name
        let empty_name = vec![].try_into().unwrap();
        assert_noop!(
            Did::register_institution(RuntimeOrigin::signed(account), empty_name),
            Error::<Test>::InvalidInstitutionName
        );
    });
}

#[test]
fn verify_institution_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;
        let public_key = [1u8; 32];

        // Create DID and register institution
        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(account),
            public_key,
            KeyType::Ed25519
        ));

        let name = b"Harvard University".to_vec().try_into().unwrap();
        assert_ok!(Did::register_institution(
            RuntimeOrigin::signed(account),
            name
        ));

        // Verify institution (requires root)
        assert_ok!(Did::verify_institution(RuntimeOrigin::root(), account));

        // Check verification status
        let institution = Institutions::<Test>::get(account).unwrap();
        assert_eq!(institution.verified, true);

        // Verify event
        System::assert_last_event(Event::InstitutionVerified { did: account }.into());
    });
}

#[test]
fn verify_institution_fails_for_non_root() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;
        let public_key = [1u8; 32];

        // Create DID and register institution
        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(account),
            public_key,
            KeyType::Ed25519
        ));

        let name = b"Harvard University".to_vec().try_into().unwrap();
        assert_ok!(Did::register_institution(
            RuntimeOrigin::signed(account),
            name
        ));

        // Try to verify from non-root account
        assert_noop!(
            Did::verify_institution(RuntimeOrigin::signed(account), account),
            DispatchError::BadOrigin
        );
    });
}

#[test]
fn revoke_institution_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;
        let public_key = [1u8; 32];

        // Create DID, register and verify institution
        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(account),
            public_key,
            KeyType::Ed25519
        ));

        let name = b"Harvard University".to_vec().try_into().unwrap();
        assert_ok!(Did::register_institution(
            RuntimeOrigin::signed(account),
            name
        ));

        assert_ok!(Did::verify_institution(RuntimeOrigin::root(), account));

        // Revoke verification
        assert_ok!(Did::revoke_institution(RuntimeOrigin::root(), account));

        // Check verification status
        let institution = Institutions::<Test>::get(account).unwrap();
        assert_eq!(institution.verified, false);

        // Verify event
        System::assert_last_event(Event::InstitutionRevoked { did: account }.into());
    });
}

#[test]
fn revoke_institution_fails_for_non_root() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;
        let public_key = [1u8; 32];

        // Create DID, register and verify institution
        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(account),
            public_key,
            KeyType::Ed25519
        ));

        let name = b"Harvard University".to_vec().try_into().unwrap();
        assert_ok!(Did::register_institution(
            RuntimeOrigin::signed(account),
            name
        ));

        assert_ok!(Did::verify_institution(RuntimeOrigin::root(), account));

        // Try to revoke from non-root account
        assert_noop!(
            Did::revoke_institution(RuntimeOrigin::signed(account), account),
            DispatchError::BadOrigin
        );
    });
}

#[test]
fn revoke_institution_fails_if_not_found() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;

        // Try to revoke non-existent institution
        assert_noop!(
            Did::revoke_institution(RuntimeOrigin::root(), account),
            Error::<Test>::InstitutionNotFound
        );
    });
}

// ============================================================
// INTEGRATION TESTS
// ============================================================

#[test]
fn complete_did_lifecycle() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);

        let account = 1u64;

        // 1. Create DID
        assert_ok!(Did::create_did(
            RuntimeOrigin::signed(account),
            [1u8; 32],
            KeyType::Ed25519
        ));

        // 2. Add multiple keys
        assert_ok!(Did::add_public_key(
            RuntimeOrigin::signed(account),
            [2u8; 32],
            KeyType::Sr25519
        ));

        assert_ok!(Did::add_public_key(
            RuntimeOrigin::signed(account),
            [3u8; 32],
            KeyType::Ecdsa
        ));

        // 3. Register as institution
        let name = b"MIT".to_vec().try_into().unwrap();
        assert_ok!(Did::register_institution(
            RuntimeOrigin::signed(account),
            name
        ));

        // 4. Verify institution
        assert_ok!(Did::verify_institution(RuntimeOrigin::root(), account));

        // 5. Deactivate DID
        assert_ok!(Did::deactivate_did(RuntimeOrigin::signed(account)));

        // 6. Reactivate DID
        assert_ok!(Did::reactivate_did(RuntimeOrigin::signed(account)));

        // Verify final state
        let did_doc = DidDocuments::<Test>::get(account).unwrap();
        assert_eq!(did_doc.public_keys.len(), 3);
        assert_eq!(did_doc.active, true);

        let institution = Institutions::<Test>::get(account).unwrap();
        assert_eq!(institution.verified, true);
    });
}
