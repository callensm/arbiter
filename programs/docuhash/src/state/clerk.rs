use anchor_lang::prelude::*;

use crate::error::ErrorCode;
use crate::seeds;

#[account]
pub struct Clerk {
    /// The wallet public key authority behind the program account.
    pub authority: Pubkey,

    /// The vector of `Document` public keys owned by the account.
    pub documents: Vec<Pubkey>,

    /// The maximum number of `Document` public keys that
    /// can be stored in the vector.
    pub limit: u8,

    /// The program account bump nonce.
    pub bump: [u8; 1],
}

impl Clerk {
    /// Returns the byte size of the `Clerk` struct given the number
    /// of allowed `Document` public keys to be stored.
    pub fn space(size: usize) -> usize {
        8 + 32 + (4 + 32 * size) + 1 + 1
    }

    /// Whether the documents public key vector is storing the maximum
    /// number of non-default keys allowed.
    pub fn is_full(&self) -> bool {
        self.documents
            .iter()
            .filter(|&d| *d != Pubkey::default())
            .collect::<Vec<&Pubkey>>()
            .len()
            >= self.limit as usize
    }

    /// Returns the list of program account signer seeds for the account.
    pub fn signer_seeds(&self) -> [&[u8]; 3] {
        [seeds::CLERK, self.authority.as_ref(), &self.bump]
    }

    /// Finds the first index of `Pubkey::default()` in the `documents` struct vector
    /// and replaces it with the argued `Document` public key.
    pub fn try_assign(&mut self, document: Pubkey) -> ProgramResult {
        let i = self
            .documents
            .iter()
            .position(|&d| d == Pubkey::default())
            .ok_or_else(|| ErrorCode::ClerkDocumentListIsFull)?;

        self.documents[i] = document;
        Ok(())
    }
}
