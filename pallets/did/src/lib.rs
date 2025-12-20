#![cfg_attr(not(feature = "std"), no_std)]

//! # DID Pallet
//! 
//! ## Overview
//! This pallet implements Decentralized Identifiers (DIDs) for academic verification.

pub use pallet::*;
use frame::hashing;

#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

pub mod weights;
pub use weights::*;


#[frame::pallet]
pub mod pallet {
    use super::*;
    use frame::prelude::*;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    /// The pallet's configuration trait
    #[pallet::config]
    pub trait Config: frame_system::Config {
        /// The overarching event type
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        
        /// Maximum size of institution name or document metadata
        #[pallet::constant]
        type MaxDocumentSize: Get<u32>;
        
        /// Maximum number of public keys per DID
        #[pallet::constant]
        type MaxPublicKeys: Get<u32>;

        /// Weight information for extrinsics
        type WeightInfo: WeightInfo;
    }


    //Events
    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        DidCreated { owner: T::AccountId },
        DidUpdated { owner: T::AccountId },
        DidDeactivated { owner: T::AccountId },
        PublicKeyAdded { owner: T::AccountId, key_id: [u8; 32] },
        PublicKeyRemoved { owner: T::AccountId, key_id: [u8; 32] },
        InstitutionRegistered { did: T::AccountId, name: BoundedVec<u8, T::MaxDocumentSize> },
        InstitutionVerified { did: T::AccountId },
        InstitutionRevoked { did: T::AccountId },
    }

    //Storage

    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct PublicKeyEntry {
        pub key_id: [u8; 32],
        pub key_type: KeyType,
        pub public_key: [u8; 32],
    }

    #[derive(Clone, Copy, Encode, Decode, DecodeWithMemTracking, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub enum KeyType {
        Ed25519,
        Sr25519,
        Ecdsa,
    }

      /// DID Document containing identity information
      #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
      #[scale_info(skip_type_params(T))]
      pub struct DidDocument<T: Config> {
        pub controller: T::AccountId,
        pub public_keys: BoundedVec<PublicKeyEntry, T::MaxPublicKeys>,
        pub created_at: BlockNumberFor<T>,
        pub updated_at: BlockNumberFor<T>,
        pub active: bool,
      }

      /// Institution registration information
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    #[scale_info(skip_type_params(T))]
    pub struct Institution<T: Config> {
        pub name: BoundedVec<u8, T::MaxDocumentSize>,
        pub did: T::AccountId,
        pub verfified: bool,
        pub registered_at: BlockNumberFor<T>,
    }

    ///Storage of all DID documents, indexed by account ID
    #[pallet::storage]
    #[pallet::getter(fn did_documents)]
    pub type DidDocuments<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        DidDocument<T>,
    >;

    /// Storage of institution registrations
    #[pallet::storage]
    #[pallet::getter(fn institutions)]
    pub type Institutions<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        Institution<T>,
    >;
    //Errors
    #[pallet::error]
    pub enum Error<T> {
        DidAlreadyExists,
        DidNotFound,
        NotAuthorized,
        TooManyPublicKeys,
        PublicKeyAlreadyExists,
        PublicKeyNotFound,
        InstitutionAlreadyRegistered,
        InstitutionNotFound,
        DidInactive,
        InvalidInstitutionName,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Create a new DID with an initial public key
        ///
        /// # Arguments
        /// * `origin` - The account creating the DID
        /// * `public_key` - The initial public key to associate
        /// * `key_type` - The type of the public key
        ///
        /// # Errors
        /// * `DidAlreadyExists` - If a DID already exists for this account
        /// * `TooManyPublicKeys` - Should not occur on creation with single key
        #[pallet::call_index(0)]
        #[pallet::weight(T::WeightInfo::create_did())]
        pub fn create_did(
            origin: OriginFor<T>,
            public_key: [u8; 32],
            key_type: KeyType,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;

            ensure!(
                !DidDocuments::<T>::contains_key(&who),
                Error::<T>::DidAlreadyExists
            );

            let key_entry = PublicKeyEntry {
                key_id: hashing::blake2_256(&public_key),
                key_type,
                public_key,
            };

            let mut public_keys = BoundedVec::new();
            public_keys.try_push(key_entry)
                .map_err(|_| Error::<T>::TooManyPublicKeys)?;

            let did_doc = DidDocument {
                controller: who.clone(),
                public_keys,
                created_at: frame_system::Pallet::<T>::block_number(),
                updated_at: frame_system::Pallet::<T>::block_number(),
                active: true,
            };

            DidDocuments::<T>::insert(&who, did_doc);
            Self::deposit_event(Event::DidCreated { owner: who });

            Ok(())

        }

    }


}