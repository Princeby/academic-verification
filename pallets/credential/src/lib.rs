#![cfg_attr(not(feature = "std"), no_std)]

//! # Credential Pallet
//! 
//! Academic credential issuance and verification
//! 

pub use pallet::*;

#[frame::pallet]
pub mod pallet {
    use frame::prelude::*;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: frame_system::Config + did::Config {}
}