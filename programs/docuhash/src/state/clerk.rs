use anchor_lang::prelude::*;

use crate::error::ErrorCode;
use crate::seeds;

#[account]
pub struct Clerk {
    /// The wallet public key authority behind the program account.
    pub authority: Pubkey,

    /// The vector of `Document` public keys owned by the account.
    pub documents: Vec<Pubkey>,

    /// The number of document limit upgrades this clerk has done.
    pub upgrades: u8,

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
        !self.documents.iter().any(|&d| d == Pubkey::default())
    }

    /// Checks if the program account contains the argued `Document`
    /// public key in its vector of documents.
    pub fn is_holding(&self, doc: &Pubkey) -> bool {
        self.documents.iter().any(|d| d == doc)
    }

    /// Returns the current document holding limit of the clerk.
    pub fn limit(&self) -> usize {
        self.documents.len()
    }

    /// Returns the list of program account signer seeds for the account.
    pub fn signer_seeds(&self) -> [&[u8]; 3] {
        [seeds::CLERK, self.authority.as_ref(), &self.bump]
    }

    /// Finds the first index of `Pubkey::default()` in the `documents` struct vector
    /// and replaces it with the argued `Document` public key.
    pub fn try_assign(&mut self, document: Pubkey) -> Result<()> {
        let i = self
            .documents
            .iter()
            .position(|&d| d == Pubkey::default())
            .ok_or(ErrorCode::ClerkDocumentListIsFull)?;

        self.documents[i] = document;
        Ok(())
    }
}
