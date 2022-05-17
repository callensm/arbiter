use anchor_lang::prelude::*;
#[cfg(any(test, feature = "cli"))]
use serde::ser::{Serialize, SerializeStruct, Serializer};

use crate::error::ErrorCode;
use crate::seeds;

#[account]
pub struct Document {
    /// The public key of the wallet that created the document.
    pub authority: Pubkey,

    /// The immutable title of the document (cannot be changed after creation).
    pub title: String,

    /// The content address URI of the document agnostic to storage platform.
    pub uri: String,

    /// The unix timestamp of when the document was initialized.
    pub created_at: u64,

    /// The public keys that are required to sign and send approval transactions.
    pub participants: Vec<Pubkey>,

    /// Vector of boolean flags to indicate which public key participants have signed.
    pub signature_timestamps: Vec<u64>,

    /// Whether all public key participants have signed the document.
    pub finalization_timestamp: u64,

    /// The program account bump nonce.
    pub bump: [u8; 1],
}

impl Document {
    /// Returns the byte size of the `Document` struct given the number of
    /// participants required to submit signed approval transactions.
    pub fn space(title_size: usize, uri_size: usize, part_size: usize) -> usize {
        8 + 32
            + (4 + title_size)
            + (4 + uri_size)
            + 8
            + (4 + 32 * part_size)
            + (4 + 8 * part_size)
            + 8
            + 1
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
        self.signature_timestamps.iter().all(|&t| t > 0)
    }

    /// Whether the document has all signatures required and has been
    /// finalized by the creator.
    pub fn is_finalized(&self) -> bool {
        self.finalization_timestamp != 0
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
        Ok(*self.signature_timestamps.get(i).unwrap() != 0)
    }

    /// Attempt to mark the argued public key participant as having signed the document.
    pub fn try_sign<'a>(&mut self, participant: &Signer<'a>) -> Result<()> {
        let i = self.try_find_participant(&participant.key())?;
        self.signature_timestamps[i] = Clock::get()?.unix_timestamp as u64;
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

#[cfg(any(test, feature = "cli"))]
impl Serialize for Document {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut s = serializer.serialize_struct("Document", 6)?;
        s.serialize_field("authority", &self.authority.to_string())?;
        s.serialize_field("title", &self.title)?;
        s.serialize_field("createdAt", &self.created_at)?;
        s.serialize_field(
            "participants",
            &self
                .participants
                .iter()
                .map(|p| p.to_string())
                .collect::<Vec<String>>(),
        )?;
        s.serialize_field("signatureTimestamps", &self.signature_timestamps)?;
        s.serialize_field("finalizationTimestamp", &self.finalization_timestamp)?;
        s.end()
    }
}

#[cfg(test)]
mod tests {
    use serde_test::{assert_ser_tokens, Token};

    use super::*;

    #[test]
    fn document_serialization() {
        assert_ser_tokens(
            &Document {
                authority: Pubkey::default(),
                title: "Test".into(),
                uri: "https://arweave.net/abc1234567890".into(),
                created_at: 0,
                participants: vec![Pubkey::default()],
                signature_timestamps: vec![0],
                finalization_timestamp: 0,
                bump: [0],
            },
            &[
                Token::Struct {
                    name: "Document",
                    len: 6,
                },
                Token::Str("authority"),
                Token::Str("11111111111111111111111111111111"),
                Token::Str("title"),
                Token::Str("Test"),
                Token::Str("createdAt"),
                Token::U64(0),
                Token::Str("participants"),
                Token::Seq { len: Some(1) },
                Token::Str("11111111111111111111111111111111"),
                Token::SeqEnd,
                Token::Str("signatureTimestamps"),
                Token::Seq { len: Some(1) },
                Token::U64(0),
                Token::SeqEnd,
                Token::Str("finalizationTimestamp"),
                Token::U64(0),
                Token::StructEnd,
            ],
        );
    }
}
