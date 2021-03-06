use anchor_lang::prelude::*;

use crate::error::ErrorCode;
use crate::seeds;
use crate::state::Clerk;

#[derive(Accounts)]
#[instruction(limit: u8)]
pub struct InitClerk<'info> {
    /// The system account that is signing the transaction
    /// and is the owner of the `clerk` account.
    pub authority: Signer<'info>,

    /// The wallet paying for the initialization of the
    /// new `clerk` program account.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The `Clerk` program account that is being initialized
    /// for the `authority` wallet.
    #[account(
        init,
        payer = payer,
        seeds = [
            seeds::CLERK,
            authority.key().as_ref(),
        ],
        bump,
        space = Clerk::space(limit as usize),
    )]
    pub clerk: Account<'info, Clerk>,

    /// The global system program.
    pub system_program: Program<'info, System>,
}

impl<'info> InitClerk<'info> {
    /// Instruction prevalidation for `init_clerk`.
    pub fn prevalidate(_ctx: &Context<Self>, limit: u8) -> Result<()> {
        require_gt!(limit, 0, ErrorCode::ClerkLimitIsZero);
        Ok(())
    }
}

/// Instruction entrypoint handler for `init_clerk`.
pub fn init_clerk_handler(ctx: Context<InitClerk>, limit: u8) -> Result<()> {
    let Context {
        accounts: InitClerk {
            authority, clerk, ..
        },
        bumps,
        ..
    } = ctx;

    **clerk = Clerk {
        authority: authority.key(),
        documents: vec![Pubkey::default(); limit as usize],
        upgrades: 0,
        bump: [*bumps.get("clerk").unwrap()],
    };

    Ok(())
}
