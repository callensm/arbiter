use anchor_lang::prelude::*;

mod error;
mod instructions;
mod state;

use instructions::*;

declare_id!("8t2FtnqVEoKw16CsyEDA9syRMi4At2rPNf337kwMtuw9");

#[program]
pub mod docuhash {
    use super::*;

    #[access_control(AddSignature::prevalidate(&ctx))]
    pub fn add_signature(ctx: Context<AddSignature>) -> ProgramResult {
        instructions::add_signature_handler(ctx)
    }

    #[access_control(Finalize::prevalidate(&ctx))]
    pub fn finalize(ctx: Context<Finalize>) -> ProgramResult {
        instructions::finalize_handler(ctx)
    }

    #[access_control(InitDocument::prevalidate(&ctx, &participants))]
    pub fn init_document(ctx: Context<InitDocument>, participants: Vec<Pubkey>) -> ProgramResult {
        instructions::init_document_handler(ctx, participants)
    }
}
