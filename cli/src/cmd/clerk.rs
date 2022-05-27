use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::solana_sdk::signer::Signer;
use anchor_client::solana_sdk::system_program;
use anyhow::Result;
use clap::Subcommand;

use crate::config::Config;
use crate::macros::{assert_exists, assert_not_exists};
use crate::program::{create_program_client, send_with_approval};
use crate::terminal::{print_serialized, DisplayOptions};

/// The variants for each clerk program account command.
#[derive(Subcommand)]
pub enum ClerkCommand {
    /// Create a new clerk program account.
    Create {
        /// The initial document storage limit for the account.
        #[clap(long, default_value_t = 10)]
        limit: u8,
    },
    /// Get the serialized account data for a clerk.
    Get {
        /// The pubkey of the clerk program account.
        address: Option<Pubkey>,
        /// Display the account data as JSON.
        #[clap(long)]
        json: bool,
        /// The pubkey of the clerk owner to derive with.
        #[clap(long, conflicts_with = "address")]
        owner: Option<Pubkey>,
        /// Pretty print the serialized account data.
        #[clap(long)]
        pretty: bool,
    },
    /// Upgrade the document storage limit for your clerk.
    Upgrade {
        /// The amount to increase the document storage by.
        #[clap(long)]
        amount: u8,
    },
}

pub fn entry(cfg: &Config, subcmd: &ClerkCommand) -> Result<()> {
    match subcmd {
        ClerkCommand::Create { limit } => process_create(cfg, *limit),
        ClerkCommand::Get {
            address,
            json,
            owner,
            pretty,
        } => process_get(
            cfg,
            address,
            owner,
            DisplayOptions::from_args(*json, *pretty),
        ),
        ClerkCommand::Upgrade { amount } => process_upgrade(cfg, *amount),
    }
}

fn process_create(cfg: &Config, limit: u8) -> Result<()> {
    let (program, signer) = create_program_client(cfg);

    let clerk = Pubkey::find_program_address(
        &[arbiter::seeds::CLERK, signer.pubkey().as_ref()],
        &program.id(),
    )
    .0;

    assert_not_exists!(&program, arbiter::state::Clerk, &clerk);

    send_with_approval(
        cfg,
        program
            .request()
            .accounts(arbiter::accounts::InitClerk {
                authority: signer.pubkey(),
                payer: signer.pubkey(),
                clerk,
                system_program: system_program::ID,
            })
            .args(arbiter::instruction::InitClerk { limit })
            .signer(signer.as_ref()),
        vec!["arbiter::InitClerk"],
    )
}

fn process_get(
    cfg: &Config,
    address: &Option<Pubkey>,
    owner: &Option<Pubkey>,
    display: DisplayOptions,
) -> Result<()> {
    let (program, signer) = create_program_client(cfg);
    let owner_pk = owner.unwrap_or_else(|| signer.pubkey());
    let clerk_addr = address.unwrap_or_else(|| {
        Pubkey::find_program_address(&[arbiter::seeds::CLERK, owner_pk.as_ref()], &program.id()).0
    });

    print_serialized(
        program.account::<arbiter::state::Clerk>(clerk_addr)?,
        &display,
    )
}

fn process_upgrade(cfg: &Config, amount: u8) -> Result<()> {
    let (program, signer) = create_program_client(cfg);
    let clerk = Pubkey::find_program_address(
        &[arbiter::seeds::CLERK, signer.pubkey().as_ref()],
        &program.id(),
    )
    .0;

    assert_exists!(&program, arbiter::state::Clerk, &clerk);

    send_with_approval(
        cfg,
        program
            .request()
            .accounts(arbiter::accounts::Upgrade {
                authority: signer.pubkey(),
                clerk,
                system_program: system_program::ID,
            })
            .args(arbiter::instruction::Upgrade {
                increase_amount: amount,
            })
            .signer(signer.as_ref()),
        vec!["arbiter::Upgrade"],
    )
}
