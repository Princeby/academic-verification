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
        pub verified: bool,
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

        #[pallet::call_index(1)]
        #[pallet::weight(T::WeightInfo::add_public_key())]
        pub fn add_public_key(
            origin: OriginFor<T>,
            public_key: [u8; 32],
            key_type: KeyType,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;

            DidDocuments::<T>::try_mutate(&who, |did_doc_opt| -> DispatchResult {
                let did_doc = did_doc_opt.as_mut()
                    .ok_or(Error::<T>::DidNotFound)?;

                ensure!(did_doc.controller == who, Error::<T>::NotAuthorized);
                ensure!(did_doc.active, Error::<T>::DidInactive);

                let key_id = hashing::blake2_256(&public_key);

                ensure!(
                    !did_doc.public_keys.iter().any(|k| k.key_id == key_id),
                    Error::<T>::PublicKeyAlreadyExists
                );

                let key_entry = PublicKeyEntry {
                    key_id,
                    key_type,
                    public_key,
                };

                did_doc.public_keys.try_push(key_entry)
                    .map_err(|_| Error::<T>::TooManyPublicKeys)?;

                did_doc.updated_at = frame_system::Pallet::<T>::block_number();

                Self::deposit_event(Event::PublicKeyAdded { 
                    owner: who.clone(), 
                    key_id 
                });

                Ok(())
            })
        }


       //Remove a public key from a DID
        #[pallet::call_index(2)]
        #[pallet::weight(T::WeightInfo::remove_public_key())]
        pub fn remove_public_key(
            origin: OriginFor<T>,
            key_id: [u8; 32],
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;

            DidDocuments::<T>::try_mutate(&who, |did_doc_opt| -> DispatchResult {
                let did_doc = did_doc_opt.as_mut()
                    .ok_or(Error::<T>::DidNotFound)?;

                ensure!(did_doc.controller == who, Error::<T>::NotAuthorized);

                let initial_len = did_doc.public_keys.len();
                did_doc.public_keys.retain(|k| k.key_id != key_id);

                ensure!(
                    did_doc.public_keys.len() < initial_len,
                    Error::<T>::PublicKeyNotFound
                );

                did_doc.updated_at = frame_system::Pallet::<T>::block_number();

                Self::deposit_event(Event::PublicKeyRemoved { 
                    owner: who.clone(), 
                    key_id 
                });

                Ok(())
            })
        }

        /// Deactivate a DID
        #[pallet::call_index(3)]
        #[pallet::weight(T::WeightInfo::deactivate_did())]
        pub fn deactivate_did(origin: OriginFor<T>) -> DispatchResult {
            let who = ensure_signed(origin)?;

            DidDocuments::<T>::try_mutate(&who, |did_doc_opt| -> DispatchResult {
                let did_doc = did_doc_opt.as_mut()
                    .ok_or(Error::<T>::DidNotFound)?;

                ensure!(did_doc.controller == who, Error::<T>::NotAuthorized);

                did_doc.active = false;
                did_doc.updated_at = frame_system::Pallet::<T>::block_number();

                Self::deposit_event(Event::DidDeactivated { owner: who.clone() });

                Ok(())
            })
        }

        /// Reactivate a deactivated DID
        #[pallet::call_index(4)]
        #[pallet::weight(T::WeightInfo::reactivate_did())]
        pub fn reactivate_did(origin: OriginFor<T>) -> DispatchResult {
            let who = ensure_signed(origin)?;

            DidDocuments::<T>::try_mutate(&who, |did_doc_opt| -> DispatchResult {
                let did_doc = did_doc_opt.as_mut()
                    .ok_or(Error::<T>::DidNotFound)?;

                ensure!(did_doc.controller == who, Error::<T>::NotAuthorized);

                did_doc.active = true;
                did_doc.updated_at = frame_system::Pallet::<T>::block_number();

                Self::deposit_event(Event::DidUpdated { owner: who.clone() });

                Ok(())
            })
        }

        /// Register as an academic institution
        #[pallet::call_index(5)]
        #[pallet::weight(T::WeightInfo::register_institution())]
        pub fn register_institution(
            origin: OriginFor<T>,
            name: BoundedVec<u8, T::MaxDocumentSize>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;

            ensure!(
                !Institutions::<T>::contains_key(&who), 
                Error::<T>::InstitutionAlreadyRegistered
            );

            ensure!(
                DidDocuments::<T>::contains_key(&who), 
                Error::<T>::DidNotFound
            );

            ensure!(!name.is_empty(), Error::<T>::InvalidInstitutionName);

            let institution = Institution {
                name: name.clone(),
                did: who.clone(),
                verified: false,
                registered_at: frame_system::Pallet::<T>::block_number(),
            };

            Institutions::<T>::insert(&who, institution);

            Self::deposit_event(Event::InstitutionRegistered { 
                did: who, 
                name 
            });

            Ok(())
        }

        /// Verify an institution (governance/root only)
        #[pallet::call_index(6)]
        #[pallet::weight(T::WeightInfo::verify_institution())]
        pub fn verify_institution(
            origin: OriginFor<T>,
            institution_did: T::AccountId,
        ) -> DispatchResult {
            ensure_root(origin)?;

            Institutions::<T>::try_mutate(&institution_did, |institution_opt| -> DispatchResult {
                let institution = institution_opt.as_mut()
                    .ok_or(Error::<T>::InstitutionNotFound)?;
                
                institution.verified = true;

                Self::deposit_event(Event::InstitutionVerified { 
                    did: institution_did.clone() 
                });

                Ok(())
            })
        }

        /// Revoke institution verification (governance/root only)
        #[pallet::call_index(7)]
        #[pallet::weight(T::WeightInfo::revoke_institution())]
        pub fn revoke_institution(
            origin: OriginFor<T>,
            institution_did: T::AccountId,
        ) -> DispatchResult {
            ensure_root(origin)?;

            Institutions::<T>::try_mutate(&institution_did, |institution_opt| -> DispatchResult {
                let institution = institution_opt.as_mut()
                    .ok_or(Error::<T>::InstitutionNotFound)?;
                
                institution.verified = false;

                Self::deposit_event(Event::InstitutionRevoked { 
                    did: institution_did.clone() 
                });

                Ok(())
            })
        }

        
    }
}