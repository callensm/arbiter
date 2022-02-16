use anchor_lang::prelude::*;

use crate::error::ErrorCode;

#[account]
pub struct Document {
    /// The public key of the wallet that created the document.
    pub creator: Pubkey,

    /// The public key of the NFT mint created for the document.
    pub mint: Pubkey,

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
    pub fn space(size: usize) -> usize {
        let safe_size = if size == 0 { 1 } else { size };
        8 + 32 * 2 + (4 + 32 * safe_size) + (4 + 8 * safe_size) + 8 + 1 + 1
    }

    /// Whether the document has all signatures required and has been
    /// finalized by the creator.
    pub fn is_finalized(&self) -> bool {
        self.finalization_timestamp != 0
    }

    /// The program account signer seeds for programmatic authority.
    pub fn signer_seeds(&self) -> [&[u8]; 3] {
        [b"document".as_ref(), self.creator.as_ref(), &self.bump]
    }

    /// Try to set the timestamp of the document finalization in the account data.
    pub fn try_finalize(&mut self) -> ProgramResult {
        self.finalization_timestamp = Clock::get()?.unix_timestamp as u64;
        Ok(())
    }

    /// Check if the argued index has been marked as already signing the document.
    pub fn try_has_signed<'a>(&self, participant: &Signer<'a>) -> Result<bool, ProgramError> {
        let i = self.try_find_participant(participant.key())?;
        Ok(*self.timestamps.get(i).unwrap() != 0)
    }

    /// Attempt to mark the argued public key participant as having signed the document.
    pub fn try_sign<'a>(&mut self, participant: &Signer<'a>) -> ProgramResult {
        let i = self.try_find_participant(participant.key())?;
        self.timestamps[i] = Clock::get()?.unix_timestamp as u64;
        Ok(())
    }

    /// Attempt to find and return the index of the argued participant public key.
    fn try_find_participant(&self, participant: Pubkey) -> Result<usize, ProgramError> {
        self.participants
            .iter()
            .position(|&p| p == participant)
            .ok_or(ErrorCode::ParticipantNotAssociated.into())
    }
}
