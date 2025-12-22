use crate::{mock::*, Error, Event, CredentialType, CredentialStatus};
use frame::testing_prelude::*;

// ================== Test Constants ==================

const UNIVERSITY: u64 = 1;
const STUDENT: u64 = 2;
const VERIFIER: u64 = 3;

// ================== Issue Credential Tests ==================

#[test]
fn issue_credential_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        // Setup: Create verified institution and student DID
        setup_verified_institution(UNIVERSITY, "MIT");
        create_did_for_account(STUDENT);

        // Create credential data
        let credential_hash = [1u8; 32];
        let metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Computer Science Degree".to_vec().try_into().unwrap();

        // Issue credential
        assert_ok!(Credential::issue_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            STUDENT,
            credential_hash,
            CredentialType::Degree,
            metadata,
            None
        ));

        // Verify event was emitted
        System::assert_last_event(
            Event::CredentialIssued {
                credential_id: Credential::credential_by_hash(credential_hash).unwrap(),
                credential_hash,
                holder: STUDENT,
                issuer: UNIVERSITY,
                credential_type: CredentialType::Degree,
            }.into()
        );
    });
}

#[test]
fn issue_credential_fails_if_issuer_not_verified() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        // Setup: Register but don't verify institution
        register_institution(UNIVERSITY, "Unverified University");
        create_did_for_account(STUDENT);

        let credential_hash = [1u8; 32];
        let metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Degree".to_vec().try_into().unwrap();

        // Should fail because institution is not verified
        assert_noop!(
            Credential::issue_credential(
                RuntimeOrigin::signed(UNIVERSITY),
                STUDENT,
                credential_hash,
                CredentialType::Degree,
                metadata,
                None
            ),
            Error::<Test>::IssuerNotVerified
        );
    });
}

#[test]
fn issue_credential_fails_if_issuer_has_no_did() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        create_did_for_account(STUDENT);

        let credential_hash = [1u8; 32];
        let metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Degree".to_vec().try_into().unwrap();

        // Should fail because issuer has no DID
        assert_noop!(
            Credential::issue_credential(
                RuntimeOrigin::signed(UNIVERSITY),
                STUDENT,
                credential_hash,
                CredentialType::Degree,
                metadata,
                None
            ),
            Error::<Test>::IssuerNotVerified
        );
    });
}

#[test]
fn issue_credential_fails_if_holder_has_no_did() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        setup_verified_institution(UNIVERSITY, "MIT");
        // Don't create DID for student

        let credential_hash = [1u8; 32];
        let metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Degree".to_vec().try_into().unwrap();

        // Should fail because holder has no DID
        assert_noop!(
            Credential::issue_credential(
                RuntimeOrigin::signed(UNIVERSITY),
                STUDENT,
                credential_hash,
                CredentialType::Degree,
                metadata,
                None
            ),
            Error::<Test>::HolderHasNoDid
        );
    });
}

#[test]
fn issue_credential_fails_if_holder_did_inactive() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        setup_verified_institution(UNIVERSITY, "MIT");
        create_did_for_account(STUDENT);
        
        // Deactivate student's DID
        assert_ok!(Did::deactivate_did(RuntimeOrigin::signed(STUDENT)));

        let credential_hash = [1u8; 32];
        let metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Degree".to_vec().try_into().unwrap();

        // Should fail because holder's DID is inactive
        assert_noop!(
            Credential::issue_credential(
                RuntimeOrigin::signed(UNIVERSITY),
                STUDENT,
                credential_hash,
                CredentialType::Degree,
                metadata,
                None
            ),
            Error::<Test>::DidNotActive
        );
    });
}

#[test]
fn issue_credential_fails_for_duplicate_hash() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        setup_verified_institution(UNIVERSITY, "MIT");
        create_did_for_account(STUDENT);

        let credential_hash = [1u8; 32];
        let metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Degree".to_vec().try_into().unwrap();

        // Issue first credential
        assert_ok!(Credential::issue_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            STUDENT,
            credential_hash,
            CredentialType::Degree,
            metadata.clone(),
            None
        ));

        // Try to issue another credential with same hash
        assert_noop!(
            Credential::issue_credential(
                RuntimeOrigin::signed(UNIVERSITY),
                STUDENT,
                credential_hash,
                CredentialType::Certificate,
                metadata,
                None
            ),
            Error::<Test>::CredentialAlreadyExists
        );
    });
}

#[test]
fn issue_credential_stores_correct_data() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        setup_verified_institution(UNIVERSITY, "MIT");
        create_did_for_account(STUDENT);

        let credential_hash = [1u8; 32];
        let metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Computer Science".to_vec().try_into().unwrap();

        assert_ok!(Credential::issue_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            STUDENT,
            credential_hash,
            CredentialType::Degree,
            metadata.clone(),
            Some(1000)
        ));

        // Get credential ID
        let credential_id = Credential::credential_by_hash(credential_hash).unwrap();
        
        // Verify stored credential
        let stored = Credential::credentials(credential_id).unwrap();
        assert_eq!(stored.holder, STUDENT);
        assert_eq!(stored.issuer, UNIVERSITY);
        assert_eq!(stored.credential_type, CredentialType::Degree);
        assert_eq!(stored.metadata, metadata);
        assert_eq!(stored.status, CredentialStatus::Active);
        assert_eq!(stored.expires_at, Some(1000));
    });
}

// ================== Revoke Credential Tests ==================

#[test]
fn revoke_credential_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        // Setup and issue credential
        setup_verified_institution(UNIVERSITY, "MIT");
        create_did_for_account(STUDENT);

        let credential_hash = [1u8; 32];
        let metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Degree".to_vec().try_into().unwrap();

        assert_ok!(Credential::issue_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            STUDENT,
            credential_hash,
            CredentialType::Degree,
            metadata,
            None
        ));

        let credential_id = Credential::credential_by_hash(credential_hash).unwrap();

        // Revoke credential
        assert_ok!(Credential::revoke_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            credential_id
        ));

        // Verify status changed
        let credential = Credential::credentials(credential_id).unwrap();
        assert_eq!(credential.status, CredentialStatus::Revoked);

        // Verify event
        System::assert_last_event(
            Event::CredentialRevoked {
                credential_id,
                revoked_by: UNIVERSITY,
            }.into()
        );
    });
}

#[test]
fn revoke_credential_fails_if_not_issuer() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        // Setup
        setup_verified_institution(UNIVERSITY, "MIT");
        create_did_for_account(STUDENT);
        create_did_for_account(VERIFIER);

        let credential_hash = [1u8; 32];
        let metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Degree".to_vec().try_into().unwrap();

        assert_ok!(Credential::issue_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            STUDENT,
            credential_hash,
            CredentialType::Degree,
            metadata,
            None
        ));

        let credential_id = Credential::credential_by_hash(credential_hash).unwrap();

        // Try to revoke as non-issuer
        assert_noop!(
            Credential::revoke_credential(
                RuntimeOrigin::signed(VERIFIER),
                credential_id
            ),
            Error::<Test>::NotAuthorized
        );
    });
}

#[test]
fn revoke_credential_fails_if_already_revoked() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        setup_verified_institution(UNIVERSITY, "MIT");
        create_did_for_account(STUDENT);

        let credential_hash = [1u8; 32];
        let metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Degree".to_vec().try_into().unwrap();

        assert_ok!(Credential::issue_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            STUDENT,
            credential_hash,
            CredentialType::Degree,
            metadata,
            None
        ));

        let credential_id = Credential::credential_by_hash(credential_hash).unwrap();

        // Revoke once
        assert_ok!(Credential::revoke_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            credential_id
        ));

        // Try to revoke again
        assert_noop!(
            Credential::revoke_credential(
                RuntimeOrigin::signed(UNIVERSITY),
                credential_id
            ),
            Error::<Test>::CredentialAlreadyRevoked
        );
    });
}

#[test]
fn revoke_credential_fails_if_not_found() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        setup_verified_institution(UNIVERSITY, "MIT");

        let fake_credential_id = [99u8; 32];

        assert_noop!(
            Credential::revoke_credential(
                RuntimeOrigin::signed(UNIVERSITY),
                fake_credential_id
            ),
            Error::<Test>::CredentialNotFound
        );
    });
}

// ================== Verify Credential Tests ==================

#[test]
fn verify_credential_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        // Setup and issue credential
        setup_verified_institution(UNIVERSITY, "MIT");
        create_did_for_account(STUDENT);
        create_did_for_account(VERIFIER);

        let credential_hash = [1u8; 32];
        let metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Degree".to_vec().try_into().unwrap();

        assert_ok!(Credential::issue_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            STUDENT,
            credential_hash,
            CredentialType::Degree,
            metadata,
            None
        ));

        let credential_id = Credential::credential_by_hash(credential_hash).unwrap();

        // Verify credential
        assert_ok!(Credential::verify_credential(
            RuntimeOrigin::signed(VERIFIER),
            credential_hash
        ));

        // Check event
        System::assert_last_event(
            Event::CredentialVerified {
                credential_id,
                verified_by: VERIFIER,
            }.into()
        );
    });
}

#[test]
fn verify_credential_fails_if_revoked() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        setup_verified_institution(UNIVERSITY, "MIT");
        create_did_for_account(STUDENT);
        create_did_for_account(VERIFIER);

        let credential_hash = [1u8; 32];
        let metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Degree".to_vec().try_into().unwrap();

        assert_ok!(Credential::issue_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            STUDENT,
            credential_hash,
            CredentialType::Degree,
            metadata,
            None
        ));

        let credential_id = Credential::credential_by_hash(credential_hash).unwrap();

        // Revoke credential
        assert_ok!(Credential::revoke_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            credential_id
        ));

        // Try to verify revoked credential
        assert_noop!(
            Credential::verify_credential(
                RuntimeOrigin::signed(VERIFIER),
                credential_hash
            ),
            Error::<Test>::CredentialNotActive
        );
    });
}

#[test]
fn verify_credential_fails_if_expired() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        setup_verified_institution(UNIVERSITY, "MIT");
        create_did_for_account(STUDENT);
        create_did_for_account(VERIFIER);

        let credential_hash = [1u8; 32];
        let metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Degree".to_vec().try_into().unwrap();

        // Issue credential that expires at block 10
        assert_ok!(Credential::issue_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            STUDENT,
            credential_hash,
            CredentialType::Certificate,
            metadata,
            Some(10)
        ));

        // Move to block 11 (after expiration)
        System::set_block_number(11);

        // Try to verify expired credential
        assert_noop!(
            Credential::verify_credential(
                RuntimeOrigin::signed(VERIFIER),
                credential_hash
            ),
            Error::<Test>::CredentialExpired
        );
    });
}

#[test]
fn verify_credential_fails_if_not_found() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        create_did_for_account(VERIFIER);

        let fake_hash = [99u8; 32];

        assert_noop!(
            Credential::verify_credential(
                RuntimeOrigin::signed(VERIFIER),
                fake_hash
            ),
            Error::<Test>::CredentialNotFound
        );
    });
}

// ================== Update Metadata Tests ==================

#[test]
fn update_metadata_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        setup_verified_institution(UNIVERSITY, "MIT");
        create_did_for_account(STUDENT);

        let credential_hash = [1u8; 32];
        let metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Original Metadata".to_vec().try_into().unwrap();

        assert_ok!(Credential::issue_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            STUDENT,
            credential_hash,
            CredentialType::Degree,
            metadata,
            None
        ));

        let credential_id = Credential::credential_by_hash(credential_hash).unwrap();

        // Update metadata
        let new_metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Updated Metadata".to_vec().try_into().unwrap();

        assert_ok!(Credential::update_credential_metadata(
            RuntimeOrigin::signed(UNIVERSITY),
            credential_id,
            new_metadata.clone()
        ));

        // Verify metadata was updated
        let credential = Credential::credentials(credential_id).unwrap();
        assert_eq!(credential.metadata, new_metadata);

        // Check event
        System::assert_last_event(
            Event::CredentialMetadataUpdated {
                credential_id,
            }.into()
        );
    });
}

#[test]
fn update_metadata_fails_if_not_issuer() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        setup_verified_institution(UNIVERSITY, "MIT");
        create_did_for_account(STUDENT);

        let credential_hash = [1u8; 32];
        let metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Degree".to_vec().try_into().unwrap();

        assert_ok!(Credential::issue_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            STUDENT,
            credential_hash,
            CredentialType::Degree,
            metadata,
            None
        ));

        let credential_id = Credential::credential_by_hash(credential_hash).unwrap();
        let new_metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Updated".to_vec().try_into().unwrap();

        // Try to update as non-issuer
        assert_noop!(
            Credential::update_credential_metadata(
                RuntimeOrigin::signed(STUDENT),
                credential_id,
                new_metadata
            ),
            Error::<Test>::NotAuthorized
        );
    });
}

#[test]
fn update_metadata_fails_if_revoked() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        setup_verified_institution(UNIVERSITY, "MIT");
        create_did_for_account(STUDENT);

        let credential_hash = [1u8; 32];
        let metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Degree".to_vec().try_into().unwrap();

        assert_ok!(Credential::issue_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            STUDENT,
            credential_hash,
            CredentialType::Degree,
            metadata,
            None
        ));

        let credential_id = Credential::credential_by_hash(credential_hash).unwrap();

        // Revoke credential
        assert_ok!(Credential::revoke_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            credential_id
        ));

        let new_metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Updated".to_vec().try_into().unwrap();

        // Try to update revoked credential
        assert_noop!(
            Credential::update_credential_metadata(
                RuntimeOrigin::signed(UNIVERSITY),
                credential_id,
                new_metadata
            ),
            Error::<Test>::CredentialNotActive
        );
    });
}

// ================== Integration Tests ==================

#[test]
fn complete_credential_lifecycle() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        // Setup university and student
        setup_verified_institution(UNIVERSITY, "Stanford University");
        create_did_for_account(STUDENT);
        create_did_for_account(VERIFIER);

        // Issue credential
        let credential_hash = [1u8; 32];
        let metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Bachelor of Science in Computer Science".to_vec().try_into().unwrap();

        assert_ok!(Credential::issue_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            STUDENT,
            credential_hash,
            CredentialType::Degree,
            metadata,
            Some(1000)
        ));

        let credential_id = Credential::credential_by_hash(credential_hash).unwrap();

        // Verify credential is valid
        assert_ok!(Credential::verify_credential(
            RuntimeOrigin::signed(VERIFIER),
            credential_hash
        ));

        // Update metadata
        let new_metadata: BoundedVec<u8, MaxMetadataSize> = 
            b"Bachelor of Science in Computer Science - Honors".to_vec().try_into().unwrap();
        assert_ok!(Credential::update_credential_metadata(
            RuntimeOrigin::signed(UNIVERSITY),
            credential_id,
            new_metadata
        ));

        // Verify still works after update
        assert_ok!(Credential::verify_credential(
            RuntimeOrigin::signed(VERIFIER),
            credential_hash
        ));

        // Revoke credential
        assert_ok!(Credential::revoke_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            credential_id
        ));

        // Verification should fail after revocation
        assert_noop!(
            Credential::verify_credential(
                RuntimeOrigin::signed(VERIFIER),
                credential_hash
            ),
            Error::<Test>::CredentialNotActive
        );
    });
}

#[test]
fn multiple_credentials_per_student() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        setup_verified_institution(UNIVERSITY, "MIT");
        create_did_for_account(STUDENT);

        // Issue bachelor's degree
        let hash1 = [1u8; 32];
        let metadata1: BoundedVec<u8, MaxMetadataSize> = 
            b"Bachelor's Degree".to_vec().try_into().unwrap();
        assert_ok!(Credential::issue_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            STUDENT,
            hash1,
            CredentialType::Degree,
            metadata1,
            None
        ));

        // Issue master's degree
        let hash2 = [2u8; 32];
        let metadata2: BoundedVec<u8, MaxMetadataSize> = 
            b"Master's Degree".to_vec().try_into().unwrap();
        assert_ok!(Credential::issue_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            STUDENT,
            hash2,
            CredentialType::MastersDegree,
            metadata2,
            None
        ));

        // Issue certificate
        let hash3 = [3u8; 32];
        let metadata3: BoundedVec<u8, MaxMetadataSize> = 
            b"AI Certificate".to_vec().try_into().unwrap();
        assert_ok!(Credential::issue_credential(
            RuntimeOrigin::signed(UNIVERSITY),
            STUDENT,
            hash3,
            CredentialType::Certificate,
            metadata3,
            None
        ));

        // Verify all credentials exist
        assert!(Credential::credentials(Credential::credential_by_hash(hash1).unwrap()).is_some());
        assert!(Credential::credentials(Credential::credential_by_hash(hash2).unwrap()).is_some());
        assert!(Credential::credentials(Credential::credential_by_hash(hash3).unwrap()).is_some());

        // Check holder index
        let holder_credentials = Credential::credentials_by_holder(STUDENT);
        assert_eq!(holder_credentials.len(), 3);
    });
}