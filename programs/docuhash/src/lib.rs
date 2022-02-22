use anchor_lang::prelude::*;

mod error;
mod instructions;
mod state;

use instructions::*;

declare_id!("8t2FtnqVEoKw16CsyEDA9syRMi4At2rPNf337kwMtuw9");

/// The static PDA seeds used throughout the program.
pub mod seeds {
    use super::constant;

    /// The static seed for `Clerk` program accounts.
    #[constant]
    pub const CLERK: &[u8] = b"clerk";

    /// The static seed for `Document` program accounts.
    #[constant]
    pub const DOCUMENT: &[u8] = b"document";

    /// The static seed for token mints created as PDAs.
    #[constant]
    pub const MINT: &[u8] = b"mint";

    /// The static seed for staged program accounts.
    #[constant]
    pub const STAGED: &[u8] = b"staged";
}

#[program]
pub mod docuhash {
    use super::*;

    #[access_control(AddSignature::prevalidate(&ctx))]
    pub fn add_signature(ctx: Context<AddSignature>) -> Result<()> {
        instructions::add_signature_handler(ctx)
    }

    #[access_control(Finalize::prevalidate(&ctx))]
    pub fn finalize(ctx: Context<Finalize>) -> Result<()> {
        instructions::finalize_handler(ctx)
    }

    #[access_control(InitClerk::prevalidate(&ctx, limit))]
    pub fn init_clerk(ctx: Context<InitClerk>, limit: u8) -> Result<()> {
        instructions::init_clerk_handler(ctx, limit)
    }

    #[access_control(InitDocument::prevalidate(&ctx, &title, &participants))]
    pub fn init_document(
        ctx: Context<InitDocument>,
        title: String,
        participants: Vec<Pubkey>,
    ) -> Result<()> {
        instructions::init_document_handler(ctx, title, participants)
    }

    #[access_control(StageUpgrade::prevalidate(&ctx))]
    pub fn stage_upgrade(ctx: Context<StageUpgrade>) -> Result<()> {
        instructions::stage_upgrade_handler(ctx)
    }

    #[access_control(UpgradeLimit::prevalidate(&ctx, increase_amount))]
    pub fn upgrade_limit(ctx: Context<UpgradeLimit>, increase_amount: u8) -> Result<()> {
        instructions::upgrade_limit_handler(ctx, increase_amount)
    }
}
