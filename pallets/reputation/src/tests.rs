use crate::{mock::*, Error, Event, EndorsementType};
use frame::testing_prelude::*;
use frame::traits;

// ================== Test Constants ==================

const INSTITUTION_A: u64 = 1;
const INSTITUTION_B: u64 = 2;
const INSTITUTION_C: u64 = 3;
const STUDENT: u64 = 4;
const VERIFIER: u64 = 5;

// ================== Endorsement Tests ==================

#[test]
fn endorse_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        // Setup two institutions with DIDs
        create_did_for_account(INSTITUTION_A);
        create_did_for_account(INSTITUTION_B);

        let comment: BoundedVec<u8, MaxCommentSize> = 
            b"Excellent research contributions".to_vec().try_into().unwrap();

        // Create endorsement
        assert_ok!(Reputation::endorse(
            RuntimeOrigin::signed(INSTITUTION_A),
            INSTITUTION_B,
            EndorsementType::Research,
            comment.clone(),
            8
        ));

        // Verify event was emitted
        System::assert_last_event(
            Event::EndorsementCreated {
                endorser: INSTITUTION_A,
                endorsee: INSTITUTION_B,
                endorsement_type: EndorsementType::Research,
                weight: 8,
            }.into()
        );

        // Check endorsement was stored
        assert!(Reputation::has_endorsed(INSTITUTION_A, INSTITUTION_B));

        // Check endorsements given list
        let given = Reputation::endorsements_given(INSTITUTION_A);
        assert_eq!(given.len(), 1);
        assert_eq!(given[0].endorsee, INSTITUTION_B);
        assert_eq!(given[0].weight, 8);

        // Check endorsements received list
        let received = Reputation::endorsements_received(INSTITUTION_B);
        assert_eq!(received.len(), 1);
        assert_eq!(received[0].endorser, INSTITUTION_A);

        // Check reputation scores updated
        let score_a = Reputation::reputation_scores(INSTITUTION_A);
        assert_eq!(score_a.endorsements_given, 1);

        let score_b = Reputation::reputation_scores(INSTITUTION_B);
        assert_eq!(score_b.endorsements_received, 1);
        assert!(score_b.total_score > 0);
    });
}

#[test]
fn endorse_fails_if_endorser_has_no_did() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        create_did_for_account(INSTITUTION_B);

        let comment: BoundedVec<u8, MaxCommentSize> = 
            b"Comment".to_vec().try_into().unwrap();

        // Should fail because endorser has no DID
        assert_noop!(
            Reputation::endorse(
                RuntimeOrigin::signed(INSTITUTION_A),
                INSTITUTION_B,
                EndorsementType::Professional,
                comment,
                5
            ),
            Error::<Test>::NoDid
        );
    });
}

#[test]
fn endorse_fails_if_endorsee_has_no_did() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        create_did_for_account(INSTITUTION_A);

        let comment: BoundedVec<u8, MaxCommentSize> = 
            b"Comment".to_vec().try_into().unwrap();

        // Should fail because endorsee has no DID
        assert_noop!(
            Reputation::endorse(
                RuntimeOrigin::signed(INSTITUTION_A),
                INSTITUTION_B,
                EndorsementType::Professional,
                comment,
                5
            ),
            Error::<Test>::NoDid
        );
    });
}

#[test]
fn endorse_fails_if_did_inactive() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        create_did_for_account(INSTITUTION_A);
        create_did_for_account(INSTITUTION_B);

        // Deactivate institution B's DID
        assert_ok!(Did::deactivate_did(RuntimeOrigin::signed(INSTITUTION_B)));

        let comment: BoundedVec<u8, MaxCommentSize> = 
            b"Comment".to_vec().try_into().unwrap();

        // Should fail because endorsee's DID is inactive
        assert_noop!(
            Reputation::endorse(
                RuntimeOrigin::signed(INSTITUTION_A),
                INSTITUTION_B,
                EndorsementType::Professional,
                comment,
                5
            ),
            Error::<Test>::DidNotActive
        );
    });
}

#[test]
fn endorse_fails_for_self_endorsement() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        create_did_for_account(INSTITUTION_A);

        let comment: BoundedVec<u8, MaxCommentSize> = 
            b"I'm great!".to_vec().try_into().unwrap();

        // Should fail - cannot endorse yourself
        assert_noop!(
            Reputation::endorse(
                RuntimeOrigin::signed(INSTITUTION_A),
                INSTITUTION_A,
                EndorsementType::Professional,
                comment,
                5
            ),
            Error::<Test>::CannotEndorseSelf
        );
    });
}

#[test]
fn endorse_fails_if_already_endorsed() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        create_did_for_account(INSTITUTION_A);
        create_did_for_account(INSTITUTION_B);

        let comment: BoundedVec<u8, MaxCommentSize> = 
            b"Good work".to_vec().try_into().unwrap();

        // First endorsement succeeds
        assert_ok!(Reputation::endorse(
            RuntimeOrigin::signed(INSTITUTION_A),
            INSTITUTION_B,
            EndorsementType::Professional,
            comment.clone(),
            5
        ));

        // Second endorsement fails
        assert_noop!(
            Reputation::endorse(
                RuntimeOrigin::signed(INSTITUTION_A),
                INSTITUTION_B,
                EndorsementType::Academic,
                comment,
                7
            ),
            Error::<Test>::AlreadyEndorsed
        );
    });
}

#[test]
fn endorse_fails_for_invalid_weight() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        create_did_for_account(INSTITUTION_A);
        create_did_for_account(INSTITUTION_B);

        let comment: BoundedVec<u8, MaxCommentSize> = 
            b"Comment".to_vec().try_into().unwrap();

        // Weight 0 should fail
        assert_noop!(
            Reputation::endorse(
                RuntimeOrigin::signed(INSTITUTION_A),
                INSTITUTION_B,
                EndorsementType::Professional,
                comment.clone(),
                0
            ),
            Error::<Test>::InvalidWeight
        );

        // Weight 11 should fail
        assert_noop!(
            Reputation::endorse(
                RuntimeOrigin::signed(INSTITUTION_A),
                INSTITUTION_B,
                EndorsementType::Professional,
                comment,
                11
            ),
            Error::<Test>::InvalidWeight
        );
    });
}

#[test]
fn multiple_endorsements_from_different_accounts() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        create_did_for_account(INSTITUTION_A);
        create_did_for_account(INSTITUTION_B);
        create_did_for_account(INSTITUTION_C);

        let comment: BoundedVec<u8, MaxCommentSize> = 
            b"Great!".to_vec().try_into().unwrap();

        // Institution A endorses B
        assert_ok!(Reputation::endorse(
            RuntimeOrigin::signed(INSTITUTION_A),
            INSTITUTION_B,
            EndorsementType::Professional,
            comment.clone(),
            5
        ));

        // Institution C also endorses B
        assert_ok!(Reputation::endorse(
            RuntimeOrigin::signed(INSTITUTION_C),
            INSTITUTION_B,
            EndorsementType::Academic,
            comment,
            8
        ));

        // Check B received 2 endorsements
        let received = Reputation::endorsements_received(INSTITUTION_B);
        assert_eq!(received.len(), 2);

        // Check reputation score
        let score_b = Reputation::reputation_scores(INSTITUTION_B);
        assert_eq!(score_b.endorsements_received, 2);
        assert_eq!(score_b.total_score, 40); // 2 * 20 = 40
    });
}

// ================== Remove Endorsement Tests ==================

#[test]
fn remove_endorsement_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        // Setup and create endorsement
        create_test_endorsement(INSTITUTION_A, INSTITUTION_B);

        // Get initial score
        let initial_score = Reputation::reputation_scores(INSTITUTION_B);
        assert_eq!(initial_score.endorsements_received, 1);

        // Remove endorsement
        assert_ok!(Reputation::remove_endorsement(
            RuntimeOrigin::signed(INSTITUTION_A),
            INSTITUTION_B
        ));

        // Verify event
        System::assert_last_event(
            Event::EndorsementRemoved {
                endorser: INSTITUTION_A,
                endorsee: INSTITUTION_B,
            }.into()
        );

        // Check endorsement was removed
        assert!(!Reputation::has_endorsed(INSTITUTION_A, INSTITUTION_B));

        // Check lists were updated
        let given = Reputation::endorsements_given(INSTITUTION_A);
        assert_eq!(given.len(), 0);

        let received = Reputation::endorsements_received(INSTITUTION_B);
        assert_eq!(received.len(), 0);

        // Check reputation scores updated
        let final_score = Reputation::reputation_scores(INSTITUTION_B);
        assert_eq!(final_score.endorsements_received, 0);
        assert_eq!(final_score.total_score, 0);
    });
}

#[test]
fn remove_endorsement_fails_if_not_found() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        create_did_for_account(INSTITUTION_A);
        create_did_for_account(INSTITUTION_B);

        // Try to remove non-existent endorsement
        assert_noop!(
            Reputation::remove_endorsement(
                RuntimeOrigin::signed(INSTITUTION_A),
                INSTITUTION_B
            ),
            Error::<Test>::EndorsementNotFound
        );
    });
}

// ================== Credential Issuance Recording Tests ==================

#[test]
fn record_credential_issuance_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        setup_verified_institution(INSTITUTION_A, "MIT");

        // Record credential issuance
        assert_ok!(Reputation::record_credential_issuance(
            RuntimeOrigin::root(),
            INSTITUTION_A
        ));

        // Check reputation was updated
        let score = Reputation::reputation_scores(INSTITUTION_A);
        assert_eq!(score.credentials_issued, 1);
        assert_eq!(score.total_score, 10); // 1 * 10 = 10

        // Verify events
        System::assert_has_event(
            Event::CredentialIssuanceRecorded {
                issuer: INSTITUTION_A,
            }.into()
        );

        System::assert_last_event(
            Event::ReputationUpdated {
                account: INSTITUTION_A,
                new_score: 10,
            }.into()
        );
    });
}

#[test]
fn record_credential_issuance_fails_for_non_root() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        // Should fail because only root can call this
        assert_noop!(
            Reputation::record_credential_issuance(
                RuntimeOrigin::signed(INSTITUTION_A),
                INSTITUTION_A
            ),
            traits::BadOrigin
        );
    });
}

#[test]
fn multiple_credential_issuances_update_score() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        setup_verified_institution(INSTITUTION_A, "MIT");

        // Record 5 credential issuances
        for _ in 0..5 {
            assert_ok!(Reputation::record_credential_issuance(
                RuntimeOrigin::root(),
                INSTITUTION_A
            ));
        }

        // Check reputation
        let score = Reputation::reputation_scores(INSTITUTION_A);
        assert_eq!(score.credentials_issued, 5);
        assert_eq!(score.total_score, 50); // 5 * 10 = 50
    });
}

// ================== Credential Verification Recording Tests ==================

#[test]
fn record_credential_verification_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        create_did_for_account(VERIFIER);

        // Record verification
        assert_ok!(Reputation::record_credential_verification(
            RuntimeOrigin::signed(VERIFIER)
        ));

        // Check reputation was updated
        let score = Reputation::reputation_scores(VERIFIER);
        assert_eq!(score.credentials_verified, 1);
        assert_eq!(score.total_score, 5); // 1 * 5 = 5

        // Verify events
        System::assert_has_event(
            Event::CredentialVerificationRecorded {
                verifier: VERIFIER,
            }.into()
        );

        System::assert_last_event(
            Event::ReputationUpdated {
                account: VERIFIER,
                new_score: 5,
            }.into()
        );
    });
}

#[test]
fn multiple_verifications_update_score() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        create_did_for_account(VERIFIER);

        // Record 10 verifications
        for _ in 0..10 {
            assert_ok!(Reputation::record_credential_verification(
                RuntimeOrigin::signed(VERIFIER)
            ));
        }

        // Check reputation
        let score = Reputation::reputation_scores(VERIFIER);
        assert_eq!(score.credentials_verified, 10);
        assert_eq!(score.total_score, 50); // 10 * 5 = 50
    });
}

// ================== Reputation Score Calculation Tests ==================

#[test]
fn reputation_score_calculation_is_correct() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        setup_verified_institution(INSTITUTION_A, "MIT");

        // Issue 10 credentials (10 * 10 = 100)
        for _ in 0..10 {
            assert_ok!(Reputation::record_credential_issuance(
                RuntimeOrigin::root(),
                INSTITUTION_A
            ));
        }

        // Create DIDs for endorsers (use different account numbers)
        let endorser_accounts = [20u64, 21, 22, 23, 24]; // Use unique accounts
        
        // Receive 5 endorsements (5 * 20 = 100)
        for endorser in endorser_accounts {
            create_did_for_account(endorser);
            let comment: BoundedVec<u8, MaxCommentSize> = 
                b"Great!".to_vec().try_into().unwrap();
            assert_ok!(Reputation::endorse(
                RuntimeOrigin::signed(endorser),
                INSTITUTION_A,
                EndorsementType::Professional,
                comment,
                5
            ));
        }

        // Expected: 100 (credentials) + 100 (endorsements) = 200
        let score = Reputation::reputation_scores(INSTITUTION_A);
        assert_eq!(score.credentials_issued, 10);
        assert_eq!(score.endorsements_received, 5);
        assert_eq!(score.total_score, 200);
    });
}

#[test]
fn reputation_score_caps_at_1000() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        setup_verified_institution(INSTITUTION_A, "Super Institution");

        // Issue 150 credentials (150 * 10 = 1500, but capped at 1000)
        for _ in 0..150 {
            assert_ok!(Reputation::record_credential_issuance(
                RuntimeOrigin::root(),
                INSTITUTION_A
            ));
        }

        let score = Reputation::reputation_scores(INSTITUTION_A);
        assert_eq!(score.credentials_issued, 150);
        assert_eq!(score.total_score, 1000); // Capped at 1000
    });
}

#[test]
fn update_reputation_score_manually_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        setup_verified_institution(INSTITUTION_A, "MIT");

        // Issue 20 credentials
        for _ in 0..20 {
            assert_ok!(Reputation::record_credential_issuance(
                RuntimeOrigin::root(),
                INSTITUTION_A
            ));
        }

        // Add 10 endorsements
        for i in 0..10 {
            let endorser = 30 + i;
            create_did_for_account(endorser);
            let comment: BoundedVec<u8, MaxCommentSize> = 
                b"Great!".to_vec().try_into().unwrap();
            assert_ok!(Reputation::endorse(
                RuntimeOrigin::signed(endorser),
                INSTITUTION_A,
                EndorsementType::Professional,
                comment,
                5
            ));
        }

        // Score should be: (20 * 10) + (10 * 20) = 400
        let score = Reputation::reputation_scores(INSTITUTION_A);
        assert_eq!(score.credentials_issued, 20);
        assert_eq!(score.endorsements_received, 10);
        assert_eq!(score.total_score, 400);

        // Update score manually (root) - should recalculate same result
        assert_ok!(Reputation::update_reputation_score(
            RuntimeOrigin::root(),
            INSTITUTION_A
        ));

        // Score should remain the same after manual update
        let updated_score = Reputation::reputation_scores(INSTITUTION_A);
        assert_eq!(updated_score.total_score, 400);
    });
}
#[test]
fn update_reputation_score_fails_for_non_root() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        // Should fail because only root can call this
        assert_noop!(
            Reputation::update_reputation_score(
                RuntimeOrigin::signed(INSTITUTION_A),
                INSTITUTION_A
            ),
            traits::BadOrigin
        );
    });
}

// ================== Integration Tests ==================

#[test]
fn complete_reputation_lifecycle() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        // Setup institutions
        setup_verified_institution(INSTITUTION_A, "MIT");
        setup_verified_institution(INSTITUTION_B, "Stanford");
        create_did_for_account(STUDENT);

        // Institution A issues credentials
        for _ in 0..5 {
            assert_ok!(Reputation::record_credential_issuance(
                RuntimeOrigin::root(),
                INSTITUTION_A
            ));
        }

        // Institution B endorses Institution A
        let comment: BoundedVec<u8, MaxCommentSize> = 
            b"Excellent partner institution".to_vec().try_into().unwrap();
        assert_ok!(Reputation::endorse(
            RuntimeOrigin::signed(INSTITUTION_B),
            INSTITUTION_A,
            EndorsementType::Academic,
            comment,
            9
        ));

        // Check Institution A's reputation
        let score_a = Reputation::reputation_scores(INSTITUTION_A);
        assert_eq!(score_a.credentials_issued, 5);
        assert_eq!(score_a.endorsements_received, 1);
        assert_eq!(score_a.endorsements_given, 0);
        assert_eq!(score_a.total_score, 70); // (5 * 10) + (1 * 20) = 70

        // Check Institution B's reputation
        let score_b = Reputation::reputation_scores(INSTITUTION_B);
        assert_eq!(score_b.endorsements_given, 1);

        // Remove endorsement
        assert_ok!(Reputation::remove_endorsement(
            RuntimeOrigin::signed(INSTITUTION_B),
            INSTITUTION_A
        ));

        // Check updated reputation
        let final_score = Reputation::reputation_scores(INSTITUTION_A);
        assert_eq!(final_score.endorsements_received, 0);
        assert_eq!(final_score.total_score, 50); // Only credentials remain
    });
}

#[test]
fn endorsement_types_are_stored_correctly() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        create_did_for_account(INSTITUTION_A);
        create_did_for_account(INSTITUTION_B);

        let types = vec![
            EndorsementType::Professional,
            EndorsementType::Academic,
            EndorsementType::Research,
            EndorsementType::Teaching,
            EndorsementType::Innovation,
        ];

        // Create 5 accounts to give different endorsements
        for (i, endorsement_type) in types.iter().enumerate() {
            let endorser = 10 + i as u64;
            create_did_for_account(endorser);
            
            let comment: BoundedVec<u8, MaxCommentSize> = 
                format!("Type {}", i).as_bytes().to_vec().try_into().unwrap();

            assert_ok!(Reputation::endorse(
                RuntimeOrigin::signed(endorser),
                INSTITUTION_B,
                endorsement_type.clone(),
                comment,
                5
            ));
        }

        // Verify all endorsements were stored with correct types
        let received = Reputation::endorsements_received(INSTITUTION_B);
        assert_eq!(received.len(), 5);
        
        assert_eq!(received[0].endorsement_type, EndorsementType::Professional);
        assert_eq!(received[1].endorsement_type, EndorsementType::Academic);
        assert_eq!(received[2].endorsement_type, EndorsementType::Research);
        assert_eq!(received[3].endorsement_type, EndorsementType::Teaching);
        assert_eq!(received[4].endorsement_type, EndorsementType::Innovation);
    });
}

#[test]
fn high_reputation_institution_example() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        
        setup_verified_institution(INSTITUTION_A, "Harvard University");

        // Issue 50 credentials
        for _ in 0..50 {
            assert_ok!(Reputation::record_credential_issuance(
                RuntimeOrigin::root(),
                INSTITUTION_A
            ));
        }

        // Receive 20 endorsements from various institutions
        for i in 0..20 {
            let endorser = 100 + i;
            create_did_for_account(endorser);
            
            let comment: BoundedVec<u8, MaxCommentSize> = 
                b"Excellent!".to_vec().try_into().unwrap();

            assert_ok!(Reputation::endorse(
                RuntimeOrigin::signed(endorser),
                INSTITUTION_A,
                EndorsementType::Academic,
                comment,
                8
            ));
        }

        // Calculate expected score: (50 * 10) + (20 * 20) = 900
        let score = Reputation::reputation_scores(INSTITUTION_A);
        assert_eq!(score.credentials_issued, 50);
        assert_eq!(score.endorsements_received, 20);
        assert_eq!(score.total_score, 900);
    });
}