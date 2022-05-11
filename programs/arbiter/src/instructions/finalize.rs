use anchor_lang::prelude::*;

use crate::error::ErrorCode;
use crate::seeds;
use crate::state::{Clerk, Document};

#[derive(Accounts)]
pub struct Finalize<'info> {
    /// The transaction signer and owner of the `document`
    /// and `clerk` program accounts.
    pub authority: Signer<'info>,

    /// The system account that is paying for the initialization
    /// of the token mint and associated token account.
    #[account(mut)]
    pub payer: SystemAccount<'info>,

    /// The `Clerk` program account that is the holder of the `document`.
    #[account(
        seeds = [
            seeds::CLERK,
            clerk.authority.as_ref(),
        ],
        bump = clerk.bump[0],
        has_one = authority,
        constraint = clerk.is_holding(&document.key()) @ ErrorCode::ClerkDoesNotHoldDocument,
    )]
    pub clerk: Account<'info, Clerk>,

    /// The `Document` program account that should contain all required
    /// participant signatures and is being finalized by the `authority`.
    #[account(
        mut,
        seeds = [
            seeds::DOCUMENT,
            document.authority.as_ref(),
            Document::title_seed(&document.title),
        ],
        bump = document.bump[0],
        has_one = authority,
        constraint = !document.is_finalized() @ ErrorCode::DocumentIsAlreadyFinalized,
        constraint = document.has_all_signatures() @ ErrorCode::DocumentIsMissingSignatures,
    )]
    pub document: Account<'info, Document>,

    /// The global system program.
    pub system_program: Program<'info, System>,
}

impl<'info> Finalize<'info> {
    /// Instruction prevalidation for `finalize`.
    pub fn prevalidate(_ctx: &Context<Self>) -> Result<()> {
        Ok(())
    }
}

/// Instruction entrypoint handler for `finalize`.
pub fn finalize_handler(ctx: Context<Finalize>) -> Result<()> {
    let Context {
        accounts: Finalize { document, .. },
        ..
    } = ctx;

    document.try_finalize()?;

    Ok(())
}
