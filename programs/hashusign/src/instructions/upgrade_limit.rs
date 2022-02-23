use anchor_lang::prelude::*;

use crate::error::ErrorCode;
use crate::seeds;
use crate::state::Clerk;

#[derive(Accounts)]
#[instruction(increase_amount: u8)]
pub struct UpgradeLimit<'info> {
    /// The system account that is signing the transaction
    /// and is the owner of the `new_clerk` and `staged_clerk`.
    pub authority: Signer<'info>,

    /// The wallet paying for the initialization of the `new_clerk`.
    #[account(mut)]
    pub payer: SystemAccount<'info>,

    /// The wallet receiving the rent for closing the `staged_clerk`.
    #[account(mut)]
    pub receiver: SystemAccount<'info>,

    /// The original `Clerk` program account that is associated with
    /// the `authority` and is being reinitialized with a larger limit.
    #[account(
        mut,
        seeds = [
            seeds::CLERK,
            seeds::STAGED,
            staged_clerk.authority.as_ref(),
        ],
        bump = staged_clerk.bump[0],
        has_one = authority,
        constraint = staged_clerk.is_full() @ ErrorCode::ClerkUpgradingWithRemainingSpace,
        close = receiver,
    )]
    pub staged_clerk: Account<'info, Clerk>,

    /// The new `Clerk` program account with the requests document
    /// limit increase and will be the new maintainer of the `staged_clerk`
    /// account's list of `Document` public keys.
    #[account(
        init,
        payer = payer,
        seeds = [
            seeds::CLERK,
            authority.key().as_ref(),
        ],
        bump,
        space = Clerk::space(staged_clerk.limit().checked_add(increase_amount as usize).unwrap()),
    )]
    pub new_clerk: Account<'info, Clerk>,

    /// The global system program.
    pub system_program: Program<'info, System>,
}

impl<'info> UpgradeLimit<'info> {
    /// Instruction prevalidation for `upgrade_amount`.
    pub fn prevalidate(_ctx: &Context<Self>, increase_amount: u8) -> Result<()> {
        require!(increase_amount > 0, ErrorCode::ClerkUpgradeAmountIsZero);
        Ok(())
    }
}

/// Instruction entrypoint handler for `upgrade_limit`.
pub fn upgrade_limit_handler(ctx: Context<UpgradeLimit>, increase_amount: u8) -> Result<()> {
    let Context {
        accounts:
            UpgradeLimit {
                authority,
                staged_clerk,
                new_clerk,
                ..
            },
        bumps,
        ..
    } = ctx;

    let new_limit = staged_clerk
        .limit()
        .checked_add(increase_amount as usize)
        .unwrap();

    let mut new_documents = staged_clerk.documents.clone();
    new_documents.resize_with(new_limit, Default::default);

    **new_clerk = Clerk {
        authority: authority.key(),
        documents: new_documents,
        upgrades: staged_clerk.upgrades.checked_add(1).unwrap(),
        bump: [*bumps.get("new_clerk").unwrap()],
    };

    Ok(())
}
