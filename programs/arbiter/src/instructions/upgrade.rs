use anchor_lang::prelude::*;
use anchor_lang::solana_program::rent::Rent;
use anchor_lang::system_program::{transfer, Transfer};

use crate::error::ErrorCode;
use crate::seeds;
use crate::state::Clerk;

#[derive(Accounts)]
#[instruction(increase_amount: u8)]
pub struct Upgrade<'info> {
    /// The system account that is signing the transaction
    /// and is the owner of the `new_clerk` and `staged_clerk`.
    pub authority: Signer<'info>,

    /// The wallet paying for the account reallocation rent.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The original `Clerk` program account that is associated with
    /// the `authority` and is being reinitialized with a larger limit.
    #[account(
        mut,
        seeds = [
            seeds::CLERK,
            clerk.authority.as_ref(),
        ],
        bump = clerk.bump[0],
        has_one = authority,
        constraint = clerk.is_full() @ ErrorCode::ClerkUpgradingWithRemainingSpace,
    )]
    pub clerk: Account<'info, Clerk>,

    /// The global system program.
    pub system_program: Program<'info, System>,
}

impl<'info> Upgrade<'info> {
    /// Instruction prevalidation for `upgrade_amount`.
    pub fn prevalidate(_ctx: &Context<Self>, increase_amount: u8) -> Result<()> {
        require_gt!(increase_amount, 0, ErrorCode::ClerkUpgradeAmountIsZero);
        Ok(())
    }
}

#[event]
pub struct LimitUpgraded {
    pub clerk: Pubkey,
    pub amount: u8,
}

/// Instruction entrypoint handler for `upgrade_limit`.
pub fn upgrade(ctx: Context<Upgrade>, increase_amount: u8) -> Result<()> {
    let Upgrade {
        clerk,
        payer,
        system_program,
        ..
    } = ctx.accounts;

    let rent = Rent::get()?;

    let new_limit = clerk.limit().checked_add(increase_amount as usize).unwrap();
    let new_size = Clerk::space(new_limit);
    let delta_bytes = new_size
        .checked_sub(clerk.to_account_info().data_len())
        .unwrap();

    transfer(
        CpiContext::new(
            system_program.to_account_info(),
            Transfer {
                from: payer.to_account_info(),
                to: clerk.to_account_info(),
            },
        ),
        rent.minimum_balance(delta_bytes),
    )?;

    clerk.to_account_info().realloc(new_size, false)?;
    clerk.documents.resize_with(new_limit, Default::default);
    clerk.upgrades = clerk.upgrades.checked_add(1).unwrap();

    emit!(LimitUpgraded {
        clerk: clerk.key(),
        amount: increase_amount,
    });

    Ok(())
}
