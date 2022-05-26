use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::rent::Rent;
use anchor_lang::solana_program::system_instruction::transfer;

use crate::error::ErrorCode;
use crate::seeds;
use crate::state::Clerk;

#[derive(Accounts)]
#[instruction(increase_amount: u8)]
pub struct Upgrade<'info> {
    /// The system account that is signing the transaction
    /// and is the owner of the `new_clerk` and `staged_clerk`.
    #[account(mut)]
    pub authority: Signer<'info>,

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
    let Context {
        accounts: Upgrade {
            authority, clerk, ..
        },
        ..
    } = ctx;

    let rent = Rent::get()?;

    let new_limit = clerk.limit().checked_add(increase_amount as usize).unwrap();
    let curr_size = clerk.to_account_info().data_len();
    let new_size = Clerk::space(new_limit);

    invoke(
        &transfer(
            authority.key,
            &clerk.key(),
            rent.minimum_balance(new_size.checked_sub(curr_size).unwrap()),
        ),
        &[authority.to_account_info(), clerk.to_account_info()],
    )?;

    clerk.to_account_info().realloc(new_size, true)?;
    clerk.documents.resize_with(new_limit, Default::default);
    clerk.upgrades = clerk.upgrades.checked_add(1).unwrap();

    emit!(LimitUpgraded {
        clerk: clerk.key(),
        amount: increase_amount,
    });

    Ok(())
}
