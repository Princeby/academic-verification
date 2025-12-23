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
        type MaxCommentSize: Get<u32>;

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



}