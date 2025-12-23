#![cfg_attr(not(feature = "std"), no_std)]
//! # Reputation Pallet
//! 
//! Track reputation and endorsements for academic institutions

pub use pallet::*;

pub mod weights;
pub use weights::WeightInfo;

#[frame::pallet]
pub mod pallet {
    use frame::prelude::*;
    use crate::WeightInfo;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen, DecodeWithMemTracking)]
    pub enum EndorsementType {
        /// General professional endorsement
        Professional,
        /// Academic excellence endorsement
        Academic,
        /// Research contribution endorsement
        Research,
        /// Teaching quality endorsement
        Teaching,
        /// Innovation endorsement
        Innovation,
    }

    /// Reputation score breakdown
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen, Default)]
    pub struct ReputationScore {
        /// Total credentials issued
        pub credentials_issued: u32,
        /// Total credentials verified
        pub credentials_verified: u32,
        /// Number of endorsements received
        pub endorsements_received: u32,
        /// Number of endorsements given
        pub endorsements_given: u32,
        /// Overall reputation score (0-1000)
        pub total_score: u32,
    }

    /// Individual endorsement record
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    #[scale_info(skip_type_params(T))]
    pub struct Endorsement<T: Config> {
        /// Who gave the endorsement
        pub endorser: T::AccountId,
        /// Who received the endorsement
        pub endorsee: T::AccountId,
        /// Type of endorsement
        pub endorsement_type: EndorsementType,
        /// Optional comment
        pub comment: BoundedVec<u8, T::MaxCommentSize>,
        /// When it was given
        pub created_at: BlockNumberFor<T>,
        /// Weight/strength of endorsement (1-10)
        pub weight: u8,
    }


    #[pallet::config]
    pub trait Config: frame_system::Config + did::Config + credential::Config {

        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;

        #[pallet::constant]
        type MaxEndorsements: Get<u32>;

        #[pallet::constant]
        type MaxCommentSize: Get<u32> + Clone;

        type WeightInfo: WeightInfo;
    }

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        EndorsementCreated {
            endorser: T::AccountId,
            endorsee: T::AccountId,
            endorsement_type: EndorsementType,
            weight: u8,
        },
        EndorsementRemoved {
            endorser: T::AccountId,
            endorsee: T::AccountId,
        },
        ReputationUpdated {
            account: T::AccountId,
            new_score: u32,
        },
        CredentialIssuanceRecorded {
            issuer: T::AccountId,
        },
        CredentialVerificationRecorded {
            verifier: T::AccountId,
        }
    }

    // ================== Errors ==================

    #[pallet::error]
    pub enum Error<T> {
        /// Account has no DID
        NoDid,
        /// DID is not active
        DidNotActive,
        /// Already endorsed this account
        AlreadyEndorsed,
        /// Cannot endorse yourself
        CannotEndorseSelf,
        /// Too many endorsements
        TooManyEndorsements,
        /// Endorsement not found
        EndorsementNotFound,
        /// Invalid endorsement weight (must be 1-10)
        InvalidWeight,
        /// Comment too large
        CommentTooLarge,
        /// Account is not a verified institution
        NotVerifiedInstitution,
    }


    /// Reputation scores for each account
    #[pallet::storage]
    #[pallet::getter(fn reputation_scores)]
    pub type ReputationScores<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        ReputationScore,
        ValueQuery,
    >;

    /// Endorsements given by an account
    #[pallet::storage]
    #[pallet::getter(fn endorsements_given)]
    pub type EndorsementsGiven<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        BoundedVec<Endorsement<T>, T::MaxEndorsements>,
        ValueQuery,
    >;

    /// Endorsements received by an account
    #[pallet::storage]
    #[pallet::getter(fn endorsements_received)]
    pub type EndorsementsReceived<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        BoundedVec<Endorsement<T>, T::MaxEndorsements>,
        ValueQuery,
    >;

    /// Track if one account has already endorsed another
    #[pallet::storage]
    #[pallet::getter(fn has_endorsed)]
    pub type HasEndorsed<T: Config> = StorageDoubleMap<
        _,
        Blake2_128Concat,
        T::AccountId, // endorser
        Blake2_128Concat,
        T::AccountId, // endorsee
        bool,
        ValueQuery,
    >;
    // ================== Dispatchable Functions ==================

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Create an endorsement for another account
        ///
        /// # Arguments
        /// * `origin` - Must have an active DID
        /// * `endorsee` - Account to endorse
        /// * `endorsement_type` - Type of endorsement
        /// * `comment` - Optional comment
        /// * `weight` - Strength of endorsement (1-10)
        #[pallet::call_index(0)]
        #[pallet::weight(<T as Config>::WeightInfo::endorse())]

        pub fn endorse(
            origin: OriginFor<T>,
            endorsee: T::AccountId,
            endorsement_type: EndorsementType,
            comment: BoundedVec<u8, T::MaxCommentSize>,
            weight: u8,
        ) -> DispatchResult {
            let endorser = ensure_signed(origin)?;

            // Cannot endorse yourself
            ensure!(endorser != endorsee, Error::<T>::CannotEndorseSelf);

            // Validate weight (1-10)
            ensure!(weight >= 1 && weight <= 10, Error::<T>::InvalidWeight);

            // Check endorser has active DID
            let endorser_did = did::DidDocuments::<T>::get(&endorser)
                .ok_or(Error::<T>::NoDid)?;
            ensure!(endorser_did.active, Error::<T>::DidNotActive);

            // Check endorsee has active DID
            let endorsee_did = did::DidDocuments::<T>::get(&endorsee)
                .ok_or(Error::<T>::NoDid)?;
            ensure!(endorsee_did.active, Error::<T>::DidNotActive);

            // Check if already endorsed
            ensure!(
                !HasEndorsed::<T>::get(&endorser, &endorsee),
                Error::<T>::AlreadyEndorsed
            );

            // Create endorsement
            let endorsement = Endorsement {
                endorser: endorser.clone(),
                endorsee: endorsee.clone(),
                endorsement_type: endorsement_type.clone(),
                comment,
                created_at: frame_system::Pallet::<T>::block_number(),
                weight,
            };

            // Add to endorser's given list
            EndorsementsGiven::<T>::try_mutate(&endorser, |endorsements| -> DispatchResult {
                endorsements.try_push(endorsement.clone())
                    .map_err(|_| Error::<T>::TooManyEndorsements)?;
                Ok(())
            })?;

            // Add to endorsee's received list
            EndorsementsReceived::<T>::try_mutate(&endorsee, |endorsements| -> DispatchResult {
                endorsements.try_push(endorsement)
                    .map_err(|_| Error::<T>::TooManyEndorsements)?;
                Ok(())
            })?;

            // Mark as endorsed
            HasEndorsed::<T>::insert(&endorser, &endorsee, true);

            // Update reputation scores
            ReputationScores::<T>::mutate(&endorser, |score| {
                score.endorsements_given = score.endorsements_given.saturating_add(1);
            });

            ReputationScores::<T>::mutate(&endorsee, |score| {
                score.endorsements_received = score.endorsements_received.saturating_add(1);
                // Recalculate total score
                score.total_score = Self::calculate_reputation_score(&score);
            });

            Self::deposit_event(Event::EndorsementCreated {
                endorser,
                endorsee,
                endorsement_type,
                weight,
            });

            Ok(())
        }
    }

    // ================== Helper Functions ==================

    impl<T: Config> Pallet<T> {
        /// Calculate total reputation score
        fn calculate_reputation_score(score: &ReputationScore) -> u32 {
            let credentials_score = score.credentials_issued.saturating_mul(10);
            let verification_score = score.credentials_verified.saturating_mul(5);
            let endorsement_score = score.endorsements_received.saturating_mul(20);
            
            credentials_score
                .saturating_add(verification_score)
                .saturating_add(endorsement_score)
                .min(1000) // Cap at 1000
        }
    }

}