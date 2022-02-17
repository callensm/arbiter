use anchor_lang::prelude::*;

use crate::error::ErrorCode;
use crate::state::Document;

#[derive(Accounts)]
#[instruction(title: String, participants: Vec<Pubkey>)]
pub struct InitDocument<'info> {
    /// The system account that is signing the transaction and
    /// paying for the initialization of the `document` account.
    #[account(mut)]
    pub creator: Signer<'info>,

    /// The `Document` program account that is being initialized
    /// for a new multi-signature requirement.
    #[account(
        init,
        payer = creator,
        seeds = [
            b"document",
            creator.key().as_ref(),
        ],
        bump,
        space = Document::space(title.len(), participants.len()),
    )]
    pub document: Account<'info, Document>,

    /// The global system program.
    pub system_program: Program<'info, System>,
}

impl<'info> InitDocument<'info> {
    /// Instruction prevalidation for `init_document`.
    pub fn prevalidate(
        _ctx: &Context<Self>,
        title: &str,
        participants: &Vec<Pubkey>,
    ) -> ProgramResult {
        require!(!title.is_empty(), ErrorCode::EmptyDocumentTitle);

        require!(
            !participants.is_empty(),
            ErrorCode::EmptyDocumentParticipants,
        );

        require!(is_unique(participants), ErrorCode::ParticipantsAreNotUnique);

        Ok(())
    }
}

/// Checks if the argued vector of public keys contains any duplicates.
fn is_unique(v: &Vec<Pubkey>) -> bool {
    for (i, p) in v.iter().enumerate() {
        if v.iter().skip(i + 1).any(|e| e == p) {
            return false;
        }
    }
    true
}

/// Instruction entrypoint handler for `init_document`.
pub fn init_document_handler(
    ctx: Context<InitDocument>,
    title: String,
    participants: Vec<Pubkey>,
) -> ProgramResult {
    let Context {
        accounts: InitDocument {
            creator, document, ..
        },
        bumps,
        ..
    } = ctx;

    let num_participants = participants.len();

    **document = Document {
        creator: creator.key(),
        mint: Pubkey::default(),
        title,
        participants,
        timestamps: vec![0; num_participants],
        finalization_timestamp: 0,
        mint_bump: u8::default(),
        bump: [*bumps.get("document").unwrap()],
    };

    Ok(())
}
