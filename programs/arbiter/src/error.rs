use anchor_lang::prelude::error_code;

#[error_code]
pub enum ErrorCode {
    #[msg("The clerk account's list of documents has reached the current limit.")]
    ClerkDocumentListIsFull,

    #[msg("The provided clerk program account does not hold custody of the given document public key.")]
    ClerkDoesNotHoldDocument,

    #[msg("The provided document limit for the clerk was less than or equal to zero.")]
    ClerkLimitIsZero,

    #[msg("The provided amount to increase the clerk limit by was less than or equal to zero.")]
    ClerkUpgradeAmountIsZero,

    #[msg("The clerk account provided for upgrading has remaining document space.")]
    ClerkUpgradingWithRemainingSpace,

    #[msg("The document submitted for updating has already been finalized with all required signatures.")]
    DocumentIsAlreadyFinalized,

    #[msg("The document does not have all participant signatuers.")]
    DocumentIsMissingSignatures,

    #[msg("The participants list for the new document was empty.")]
    EmptyDocumentParticipants,

    #[msg("The title provided for the new document was empty.")]
    EmptyDocumentTitle,

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
