use anchor_lang::prelude::*;

use crate::error::ErrorCode;
use crate::state::Document;

#[derive(Accounts)]
pub struct AddSignature<'info> {
    /// The participant required to sign the document that is
    /// submitting the transaction to grant their signature
    /// on the `document` account.
    pub participant: Signer<'info>,

    /// The `Document` program account that the `participant`
    /// is proving their signature on.
    #[account(
        mut,
        seeds = [
            b"document",
            document.creator.as_ref(),
        ],
        bump = document.bump[0],
        constraint = !document.is_finalized() @ ErrorCode::DocumentIsAlreadyFinalized,
        constraint = !document.try_has_signed(&participant)? @ ErrorCode::ParticipantAlreadySigned,
    )]
    pub document: Account<'info, Document>,
}

impl<'info> AddSignature<'info> {
    /// Instruction prevalidation for `add_signature`.
    pub fn prevalidate(_ctx: &Context<Self>) -> ProgramResult {
        Ok(())
    }
}

/// Instruction entrypoint handler for `add_signature`.
pub fn add_signature_handler(ctx: Context<AddSignature>) -> ProgramResult {
    ctx.accounts.document.try_sign(&ctx.accounts.participant)?;
    Ok(())
}
