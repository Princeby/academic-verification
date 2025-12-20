#![cfg_attr(not(feature = "std"), no_std)]

//! # DID Pallet
//! 
//! ## Overview
//! This pallet implements Decentralized Identifiers (DIDs) for academic verification.

pub use pallet::*;

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
    use frame::{prelude::*, runtime::apis::KeyTypeId};

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

    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
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


}