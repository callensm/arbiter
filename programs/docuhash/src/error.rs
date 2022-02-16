use anchor_lang::prelude::{error, thiserror};

#[error]
pub enum ErrorCode {
    #[msg("The document submitted for updating has already been finalized with all required signatures.")]
    DocumentIsAlreadyFinalized,

    #[msg("The participants list for the new document was empty.")]
    EmptyDocumentParticipants,

    #[msg("The title provided for the new document was empty.")]
    EmptyDocumentTitle,

    #[msg("The document cannot be finalized until all participants have signed.")]
    FinalizingWithoutAllSignatures,

    #[msg("The document token mint authority did not match the provided document.")]
    MintAuthorityMisMatch,

    #[msg("The provided document token mint has a non-zero decimal.")]
    MintDecimalNotZero,

    #[msg("The participant has already signed the provided document.")]
    ParticipantAlreadySigned,

    #[msg("The list of participant public keys contain duplicates.")]
    ParticipantsAreNotUnique,

    #[msg("The participant public key is not associated with the document.")]
    ParticipantNotAssociated,
}
