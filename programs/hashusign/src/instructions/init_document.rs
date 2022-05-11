use anchor_lang::prelude::*;

use crate::error::ErrorCode;
use crate::seeds;
use crate::state::{Clerk, Document};

#[derive(Accounts)]
#[instruction(title: String, participants: Vec<Pubkey>)]
pub struct InitDocument<'info> {
    /// The system account that is signing the transaction and
    /// will be set as the `document` owner.
    pub authority: Signer<'info>,

    /// The wallet paying for the initialization of the `document` account.
    #[account(mut)]
    pub payer: SystemAccount<'info>,

    /// The `Clerk` program account that the `document` will be assigned to.
    #[account(
        mut,
        seeds = [
            seeds::CLERK,
            clerk.authority.as_ref(),
        ],
        bump = clerk.bump[0],
        has_one = authority,
        constraint = !clerk.is_full() @ ErrorCode::ClerkDocumentListIsFull,
    )]
    pub clerk: Account<'info, Clerk>,

    /// The `Document` program account that is being initialized
    /// for a new multi-signature requirement.
    #[account(
        init,
        payer = payer,
        seeds = [
            seeds::DOCUMENT,
            authority.key().as_ref(),
            Document::title_seed(&title),
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
    pub fn prevalidate(_ctx: &Context<Self>, title: &str, participants: &[Pubkey]) -> Result<()> {
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
fn is_unique(v: &[Pubkey]) -> bool {
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
) -> Result<()> {
    let Context {
        accounts:
            InitDocument {
                authority,
                clerk,
                document,
                ..
            },
        bumps,
        ..
    } = ctx;

    let now = Clock::get()?.unix_timestamp as u64;
    let num_participants = participants.len();

    **document = Document {
        authority: authority.key(),
        title,
        created_at: now,
        participants,
        signature_timestamps: vec![0; num_participants],
        finalization_timestamp: 0,
        bump: [*bumps.get("document").unwrap()],
    };

    clerk.try_assign(document.key())?;

    Ok(())
}
