use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::error::ErrorCode;
use crate::seeds;
use crate::state::Document;

#[derive(Accounts)]
#[instruction(participant: Pubkey)]
pub struct AddParticipant<'info> {
    /// The system account that is signing the transaction and
    /// is the authority of the `document` being updated.
    pub authority: Signer<'info>,

    /// The wallet paying for the reallocation rent of the `document`.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The `Document` program account that is being updated with
    /// new participants. This could be an addition or removal update.
    #[account(
        mut,
        seeds = [
            seeds::DOCUMENT,
            authority.key().as_ref(),
            Document::title_seed(&document.title),
        ],
        bump = document.bump[0],
        has_one = authority,
        constraint = !document.is_finalized() @ ErrorCode::DocumentIsAlreadyFinalized,
        constraint = document.try_find_participant(&participant).is_err() @ ErrorCode::ParticipantAlreadyAssociated,
    )]
    pub document: Account<'info, Document>,

    /// The global system program.
    pub system_program: Program<'info, System>,
}

impl<'info> AddParticipant<'info> {
    /// Instruction prevalidation for `add_participant`.
    pub fn prevalidate(_ctx: &Context<Self>) -> Result<()> {
        Ok(())
    }
}

#[event]
pub struct ParticipantAdded {
    pub document: Pubkey,
    pub new_participant: Pubkey,
}

/// Instruction entrypoint handler for `add_participant`.
pub fn add_participant_handler(ctx: Context<AddParticipant>, participant: Pubkey) -> Result<()> {
    let AddParticipant {
        document,
        payer,
        system_program,
        ..
    } = ctx.accounts;

    let rent = Rent::get()?;

    let new_participant_len = document.participants.len().checked_add(1).unwrap();
    let new_size = Document::space(
        document.title.len(),
        document.uri.len(),
        new_participant_len,
    );

    let delta_bytes = new_size
        .checked_sub(document.to_account_info().data_len())
        .unwrap();

    transfer(
        CpiContext::new(
            system_program.to_account_info(),
            Transfer {
                from: payer.to_account_info(),
                to: document.to_account_info(),
            },
        ),
        rent.minimum_balance(delta_bytes),
    )?;

    document.to_account_info().realloc(new_size, false)?;
    document.participants.push(participant);
    document.signature_timestamps.push(0);

    emit!(ParticipantAdded {
        document: document.key(),
        new_participant: participant,
    });

    Ok(())
}
