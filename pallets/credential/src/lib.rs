#![cfg_attr(not(feature = "std"), no_std)]

//! # Credential Pallet
//!
//! Academic credential issuance and verification

pub use pallet::*;

#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;

pub mod weights;
pub use weights::*;

#[frame::pallet]
pub mod pallet {
    use frame::{hashing, prelude::*};

    use crate::WeightInfo;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    // ================== Credential Types ==================

    /// Types of credentials supported
    #[derive(
        Clone,
        Encode,
        Decode,
        Eq,
        PartialEq,
        RuntimeDebug,
        TypeInfo,
        MaxEncodedLen,
        DecodeWithMemTracking,
    )]
    pub enum CredentialType {
        /// Bachelor's degree
        Degree,
        /// Master's degree
        MastersDegree,
        /// Doctorate (PhD)
        Doctorate,
        /// Certificate program
        Certificate,
        /// Academic transcript
        Transcript,
        /// Professional certification
        ProfessionalCertification,
        /// Custom credential type
        Other,
    }

    /// Status of a credential
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub enum CredentialStatus {
        /// Credential is valid and active
        Active,
        /// Credential has been revoked
        Revoked,
        /// Credential has expired
        Expired,
    }

    /// Core credential structure stored on-chain
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    #[scale_info(skip_type_params(T))]
    pub struct Credential<T: Config> {
        /// Unique identifier for this credential
        pub credential_id: [u8; 32],
        /// Hash of the credential content (SHA256)
        pub credential_hash: [u8; 32],
        /// The holder of the credential
        pub holder: T::AccountId,
        /// The issuer (must be a verified institution)
        pub issuer: T::AccountId,
        /// Type of credential
        pub credential_type: CredentialType,
        /// Optional metadata (e.g., degree name, field of study)
        pub metadata: BoundedVec<u8, T::MaxMetadataSize>,
        /// Block number when issued
        pub issued_at: BlockNumberFor<T>,
        /// Optional expiration block number
        pub expires_at: Option<BlockNumberFor<T>>,
        /// Current status
        pub status: CredentialStatus,
    }

    /// Lightweight credential reference for indexing
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct CredentialReference {
        pub credential_id: [u8; 32],
        pub credential_type: CredentialType,
    }

    #[pallet::config]
    pub trait Config: frame_system::Config + did::Config {
        /// The overarching event type
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;

        /// Maximum size of credential metadata
        #[pallet::constant]
        type MaxMetadataSize: Get<u32>;

        /// Maximum number of credentials per holder
        #[pallet::constant]
        type MaxCredentialsPerHolder: Get<u32>;

        ///Weight information for extrinsics
        type WeightInfo: WeightInfo;
    }

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// A new credential was issued
        CredentialIssued {
            credential_id: [u8; 32],
            credential_hash: [u8; 32],
            holder: T::AccountId,
            issuer: T::AccountId,
            credential_type: CredentialType,
        },
        /// A credential was revoked
        CredentialRevoked {
            credential_id: [u8; 32],
            revoked_by: T::AccountId,
        },
        /// A credential was verified
        CredentialVerified {
            credential_id: [u8; 32],
            verified_by: T::AccountId,
        },
        /// Credential metadata was updated
        CredentialMetadataUpdated { credential_id: [u8; 32] },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Credential not found
        CredentialNotFound,
        /// Credential already exists with this hash
        CredentialAlreadyExists,
        /// Not authorized to perform this action
        NotAuthorized,
        /// Issuer is not a verified institution
        IssuerNotVerified,
        /// Issuer has no DID
        IssuerHasNoDid,
        /// Holder has no DID
        HolderHasNoDid,
        /// Credential has already been revoked
        CredentialAlreadyRevoked,
        /// Credential has expired
        CredentialExpired,
        /// Too many credentials for this holder
        TooManyCredentials,
        /// Metadata exceeds maximum size
        MetadataTooLarge,
        /// Invalid credential hash
        InvalidCredentialHash,
        /// Credential is not active
        CredentialNotActive,
        /// DID is not active
        DidNotActive,
    }

    // ================== Storage Items ==================

    /// Main storage: credential_id => Credential
    #[pallet::storage]
    #[pallet::getter(fn credentials)]
    pub type Credentials<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        [u8; 32], // credential_id
        Credential<T>,
    >;

    /// Index: holder => list of credential references
    #[pallet::storage]
    #[pallet::getter(fn credentials_by_holder)]
    pub type CredentialsByHolder<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        BoundedVec<CredentialReference, T::MaxCredentialsPerHolder>,
        ValueQuery,
    >;

    /// Index: issuer => list of credential IDs
    #[pallet::storage]
    #[pallet::getter(fn credentials_by_issuer)]
    pub type CredentialsByIssuer<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        BoundedVec<[u8; 32], T::MaxCredentialsPerHolder>,
        ValueQuery,
    >;

    /// Index: credential_hash => credential_id (for verification)
    #[pallet::storage]
    #[pallet::getter(fn credential_by_hash)]
    pub type CredentialByHash<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        [u8; 32], // credential_hash
        [u8; 32], // credential_id
    >;

    /// Counter for generating unique credential IDs
    #[pallet::storage]
    #[pallet::getter(fn next_credential_id)]
    pub type NextCredentialId<T: Config> = StorageValue<_, u64, ValueQuery>;

    // ================== Dispatchable Functions ==================

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Issue a new credential
        #[pallet::call_index(0)]
        #[pallet::weight(<T as Config>::WeightInfo::issue_credential())]
        pub fn issue_credential(
            origin: OriginFor<T>,
            holder: T::AccountId,
            credential_hash: [u8; 32],
            credential_type: CredentialType,
            metadata: BoundedVec<u8, T::MaxMetadataSize>,
            expires_at: Option<BlockNumberFor<T>>,
        ) -> DispatchResult {
            let issuer = ensure_signed(origin)?;

            // Verify issuer is a verified institution
            let institution =
                did::Institutions::<T>::get(&issuer).ok_or(Error::<T>::IssuerNotVerified)?;
            ensure!(institution.verified, Error::<T>::IssuerNotVerified);

            // Verify issuer has active DID
            let issuer_did =
                did::DidDocuments::<T>::get(&issuer).ok_or(Error::<T>::IssuerHasNoDid)?;
            ensure!(issuer_did.active, Error::<T>::DidNotActive);

            // Verify holder has DID
            let holder_did =
                did::DidDocuments::<T>::get(&holder).ok_or(Error::<T>::HolderHasNoDid)?;
            ensure!(holder_did.active, Error::<T>::DidNotActive);

            // Ensure credential hash doesn't already exist
            ensure!(
                !CredentialByHash::<T>::contains_key(&credential_hash),
                Error::<T>::CredentialAlreadyExists
            );

            // Generate unique credential ID
            let counter = NextCredentialId::<T>::get();
            let credential_id = Self::generate_credential_id(counter, &issuer, &holder);
            NextCredentialId::<T>::put(counter.saturating_add(1));

            // Create credential
            let credential = Credential {
                credential_id,
                credential_hash,
                holder: holder.clone(),
                issuer: issuer.clone(),
                credential_type: credential_type.clone(),
                metadata,
                issued_at: frame_system::Pallet::<T>::block_number(),
                expires_at,
                status: CredentialStatus::Active,
            };

            // Store credential
            Credentials::<T>::insert(&credential_id, credential);

            // Update holder index
            CredentialsByHolder::<T>::try_mutate(&holder, |credentials| -> DispatchResult {
                let reference = CredentialReference {
                    credential_id,
                    credential_type: credential_type.clone(),
                };
                credentials
                    .try_push(reference)
                    .map_err(|_| Error::<T>::TooManyCredentials)?;
                Ok(())
            })?;

            // Update issuer index
            CredentialsByIssuer::<T>::try_mutate(&issuer, |credentials| -> DispatchResult {
                credentials
                    .try_push(credential_id)
                    .map_err(|_| Error::<T>::TooManyCredentials)?;
                Ok(())
            })?;

            // Store hash mapping
            CredentialByHash::<T>::insert(&credential_hash, credential_id);

            // Emit event
            Self::deposit_event(Event::CredentialIssued {
                credential_id,
                credential_hash,
                holder,
                issuer,
                credential_type,
            });

            Ok(())
        }

        /// Revoke a credential (only by issuer)
        #[pallet::call_index(1)]
        #[pallet::weight(<T as Config>::WeightInfo::revoke_credential())]
        pub fn revoke_credential(origin: OriginFor<T>, credential_id: [u8; 32]) -> DispatchResult {
            let revoker = ensure_signed(origin)?;

            // Get credential
            let mut credential =
                Credentials::<T>::get(&credential_id).ok_or(Error::<T>::CredentialNotFound)?;

            // Only issuer can revoke
            ensure!(credential.issuer == revoker, Error::<T>::NotAuthorized);

            // Ensure not already revoked
            ensure!(
                credential.status != CredentialStatus::Revoked,
                Error::<T>::CredentialAlreadyRevoked
            );

            // Update status
            credential.status = CredentialStatus::Revoked;
            Credentials::<T>::insert(&credential_id, credential);

            // Emit event
            Self::deposit_event(Event::CredentialRevoked {
                credential_id,
                revoked_by: revoker,
            });

            Ok(())
        }

        /// Verify a credential by hash (read-only verification, emits event)
        #[pallet::call_index(2)]
        #[pallet::weight(<T as Config>::WeightInfo::verify_credential())]
        pub fn verify_credential(
            origin: OriginFor<T>,
            credential_hash: [u8; 32],
        ) -> DispatchResult {
            let verifier = ensure_signed(origin)?;

            // Look up credential by hash
            let credential_id = CredentialByHash::<T>::get(&credential_hash)
                .ok_or(Error::<T>::CredentialNotFound)?;

            let credential =
                Credentials::<T>::get(&credential_id).ok_or(Error::<T>::CredentialNotFound)?;

            // Check if credential is active
            ensure!(
                credential.status == CredentialStatus::Active,
                Error::<T>::CredentialNotActive
            );

            // Check expiration if set
            if let Some(expires_at) = credential.expires_at {
                let current_block = frame_system::Pallet::<T>::block_number();
                ensure!(current_block <= expires_at, Error::<T>::CredentialExpired);
            }

            // Emit verification event
            Self::deposit_event(Event::CredentialVerified {
                credential_id,
                verified_by: verifier,
            });

            Ok(())
        }

        /// Update credential metadata (only by issuer)
        #[pallet::call_index(3)]
        #[pallet::weight(<T as Config>::WeightInfo::update_credential_metadata())]
        pub fn update_credential_metadata(
            origin: OriginFor<T>,
            credential_id: [u8; 32],
            new_metadata: BoundedVec<u8, T::MaxMetadataSize>,
        ) -> DispatchResult {
            let updater = ensure_signed(origin)?;

            // Get credential
            let mut credential =
                Credentials::<T>::get(&credential_id).ok_or(Error::<T>::CredentialNotFound)?;

            // Only issuer can update metadata
            ensure!(credential.issuer == updater, Error::<T>::NotAuthorized);

            // Ensure credential is active
            ensure!(
                credential.status == CredentialStatus::Active,
                Error::<T>::CredentialNotActive
            );

            // Update metadata
            credential.metadata = new_metadata;
            Credentials::<T>::insert(&credential_id, credential);

            // Emit event
            Self::deposit_event(Event::CredentialMetadataUpdated { credential_id });

            Ok(())
        }
    }

    // ================== Helper Functions ==================

    impl<T: Config> Pallet<T> {
        /// Generate a unique credential ID
        fn generate_credential_id(
            counter: u64,
            issuer: &T::AccountId,
            holder: &T::AccountId,
        ) -> [u8; 32] {
            let mut data = Vec::new();
            data.extend_from_slice(&counter.to_le_bytes());
            data.extend_from_slice(&issuer.encode());
            data.extend_from_slice(&holder.encode());
            hashing::blake2_256(&data)
        }
    }
}
