use anchor_lang::prelude::*;

use crate::seeds;
use crate::state::Clerk;

#[derive(Accounts)]
pub struct StageUpgrade<'info> {
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: SystemAccount<'info>,

    #[account(mut)]
    pub receiver: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [
            seeds::CLERK,
            old_clerk.authority.as_ref(),
        ],
        bump = old_clerk.bump[0],
        has_one = authority,
        close = receiver,
    )]
    pub old_clerk: Account<'info, Clerk>,

    #[account(
        init,
        payer = payer,
        seeds = [
            seeds::CLERK,
            seeds::STAGED,
            old_clerk.authority.as_ref(),
        ],
        bump,
        space = Clerk::space(old_clerk.limit()),
    )]
    pub staged_clerk: Account<'info, Clerk>,

    pub system_program: Program<'info, System>,
}

impl<'info> StageUpgrade<'info> {
    /// Instruction prevalidation for `stage_upgrade`.
    pub fn prevalidate(_ctx: &Context<Self>) -> Result<()> {
        Ok(())
    }
}

/// Instruction entrypoint handler for `stage_upgrade`.
pub fn stage_upgrade_handler(ctx: Context<StageUpgrade>) -> Result<()> {
    let Context {
        accounts:
            StageUpgrade {
                staged_clerk,
                old_clerk,
                ..
            },
        bumps,
        ..
    } = ctx;

    **staged_clerk = Clerk {
        authority: old_clerk.authority,
        documents: old_clerk.documents.clone(),
        upgrades: old_clerk.upgrades,
        bump: [*bumps.get("staged_clerk").unwrap()],
    };

    Ok(())
}
