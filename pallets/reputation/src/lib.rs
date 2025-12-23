#![cfg_attr(not(feature = "std"), no_std)]
//! # Reputation Pallet
//! 
//! Track reputation and endorsements for academic institutions

pub use pallet::*;

#[frame::pallet]
pub mod pallet {
    use frame::prelude::*;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: frame_system::Config + did::Config + credential::Config {

        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;

        #[pallet::constant]
        type MaxEndorsements: Get<u32>;

        #[pallet::constant]
        type MaxCommentSize: Get<u32>;
    }

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        EndorsementCreated {
            endorser: T::AccountId,
            endorsee: T::AccountId,
        }
    }




}