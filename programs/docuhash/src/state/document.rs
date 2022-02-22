use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

use crate::error::ErrorCode;
use crate::seeds;

#[account]
pub struct Document {
    /// The public key of the wallet that created the document.
    pub authority: Pubkey,

    /// The public key of the NFT mint created for the document.
    pub mint: Pubkey,

    /// The public key of the NFT token account for the document.
    pub nft: Pubkey,

    /// The immutable title of the document (cannot be changed after creation).
    pub title: String,

    /// The public keys that are required to sign and send approval transactions.
    pub participants: Vec<Pubkey>,

    /// Vector of boolean flags to indicate which public key participants have signed.
    pub timestamps: Vec<u64>,

    /// Whether all public key participants have signed the document.
    pub finalization_timestamp: u64,

    /// The token mint account bump nonce.
    pub mint_bump: u8,

    /// The program account bump nonce.
    pub bump: [u8; 1],
}

impl Document {
    /// Returns the byte size of the `Document` struct given the number of
    /// participants required to submit signed approval transactions.
    pub fn space(title_size: usize, part_size: usize) -> usize {
        8 + 32 * 4 + (4 + title_size) + (4 + 32 * part_size) + (4 + 8 * part_size) + 8 + 1 + 1
    }

    /// Convert a full document title string into a usable address seed.
    pub fn title_seed(title: &str) -> &[u8] {
        let b = title.as_bytes();
        if b.len() > 32 {
            &b[..32]
        } else {
            b
        }
    }

    /// Checks if all required participants have submitted signatures.
    pub fn has_all_signatures(&self) -> bool {
        self.timestamps.iter().all(|&t| t > 0)
    }

    /// Whether the document has all signatures required and has been
    /// finalized by the creator.
    pub fn is_finalized(&self) -> bool {
        self.finalization_timestamp != 0
    }

    /// Sets the program account fields related to the finalized token
    /// mint and NFT account associations.
    pub fn set_nft_data<'a>(
        &mut self,
        mint: &Account<'a, Mint>,
        token_account: &Account<'a, TokenAccount>,
        bump: u8,
    ) {
        self.mint = mint.key();
        self.nft = token_account.key();
        self.mint_bump = bump;
    }

    /// The program account signer seeds for programmatic authority.
    pub fn signer_seeds(&self) -> [&[u8]; 4] {
        [
            seeds::DOCUMENT,
            self.authority.as_ref(),
            Self::title_seed(&self.title),
            &self.bump,
        ]
    }

    /// Try to set the timestamp of the document finalization in the account data.
    pub fn try_finalize(&mut self) -> Result<()> {
        self.finalization_timestamp = Clock::get()?.unix_timestamp as u64;
        Ok(())
    }

    /// Check if the argued index has been marked as already signing the document.
    pub fn try_has_signed<'a>(&self, participant: &Signer<'a>) -> Result<bool> {
        let i = self.try_find_participant(&participant.key())?;
        Ok(*self.timestamps.get(i).unwrap() != 0)
    }

    /// Attempt to mark the argued public key participant as having signed the document.
    pub fn try_sign<'a>(&mut self, participant: &Signer<'a>) -> Result<()> {
        let i = self.try_find_participant(&participant.key())?;
        self.timestamps[i] = Clock::get()?.unix_timestamp as u64;
        Ok(())
    }

    /// Attempt to find and return the index of the argued participant public key.
    fn try_find_participant(&self, participant: &Pubkey) -> Result<usize> {
        self.participants
            .iter()
            .position(|p| p == participant)
            .ok_or_else(|| error!(ErrorCode::ParticipantNotAssociated))
    }
}
