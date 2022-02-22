use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{mint_to, set_authority, Mint, MintTo, SetAuthority, Token, TokenAccount};
use spl_token::instruction::AuthorityType;

use crate::error::ErrorCode;
use crate::seeds;
use crate::state::{Clerk, Document};

#[derive(Accounts)]
pub struct Finalize<'info> {
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: SystemAccount<'info>,

    #[account(
        seeds = [
            seeds::CLERK,
            clerk.authority.as_ref(),
        ],
        bump = clerk.bump[0],
        has_one = authority,
    )]
    pub clerk: Account<'info, Clerk>,

    #[account(
        mut,
        seeds = [
            seeds::DOCUMENT,
            document.authority.as_ref(),
            Document::title_seed(&document.title),
        ],
        bump = document.bump[0],
        has_one = authority,
        constraint = !document.is_finalized() @ ErrorCode::DocumentIsAlreadyFinalized,
        constraint = document.has_all_signatures() @ ErrorCode::DocumentIsMissingSignatures,
    )]
    pub document: Account<'info, Document>,

    #[account(
        init,
        payer = payer,
        seeds = [
            seeds::MINT,
            document.key().as_ref(),
        ],
        bump,
        mint::decimals = 0,
        mint::authority = document,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub nft_token_account: Account<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Finalize<'info> {
    /// Instruction prevalidation for `finalize`.
    pub fn prevalidate(_ctx: &Context<Self>) -> Result<()> {
        Ok(())
    }
}

/// Instruction entrypoint handler for `finalize`.
pub fn finalize_handler(ctx: Context<Finalize>) -> Result<()> {
    let Context {
        accounts:
            Finalize {
                document,
                mint,
                nft_token_account,
                token_program,
                ..
            },
        bumps,
        ..
    } = ctx;

    document.mint = mint.key();
    document.nft = nft_token_account.key();
    document.mint_bump = *bumps.get("mint").unwrap();

    document.try_finalize()?;

    mint_to(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            MintTo {
                authority: document.to_account_info(),
                mint: mint.to_account_info(),
                to: nft_token_account.to_account_info(),
            },
            &[&document.signer_seeds()],
        ),
        1,
    )?;

    set_authority(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            SetAuthority {
                account_or_mint: mint.to_account_info(),
                current_authority: document.to_account_info(),
            },
            &[&document.signer_seeds()],
        ),
        AuthorityType::MintTokens,
        None,
    )?;

    Ok(())
}
