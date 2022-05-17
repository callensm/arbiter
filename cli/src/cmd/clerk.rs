use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::solana_sdk::signer::Signer;
use anchor_client::solana_sdk::system_program;
use anyhow::Result;
use clap::Subcommand;

use crate::{
    config::Config,
    macros::assert_not_exists,
    program::{create_program_client, send_with_approval},
    terminal::{print_serialized, DisplayOptions},
};

#[derive(Subcommand)]
pub enum ClerkCommand {
    Create {
        #[clap(long, default_value_t = 10)]
        limit: u8,
    },
    Show {
        address: Option<Pubkey>,
        #[clap(long)]
        json: bool,
        #[clap(long, conflicts_with = "address")]
        owner: Option<Pubkey>,
        #[clap(long)]
        pretty: bool,
    },
}

pub fn entry(cfg: &Config, subcmd: &ClerkCommand) -> Result<()> {
    match subcmd {
        ClerkCommand::Create { limit } => process_create(cfg, *limit),
        ClerkCommand::Show {
            address,
            json,
            owner,
            pretty,
        } => process_show(
            cfg,
            address,
            owner,
            DisplayOptions::from_args(*json, *pretty),
        ),
    }
}

fn process_create(cfg: &Config, limit: u8) -> Result<()> {
    let (program, signer) = create_program_client(cfg);

    let (clerk_addr, ..) = Pubkey::find_program_address(
        &[arbiter::seeds::CLERK, signer.pubkey().as_ref()],
        &program.id(),
    );

    assert_not_exists!(&program, arbiter::state::Clerk, &clerk_addr);

    send_with_approval(
        cfg,
        program
            .request()
            .accounts(arbiter::accounts::InitClerk {
                authority: signer.pubkey(),
                payer: signer.pubkey(),
                clerk: clerk_addr,
                system_program: system_program::ID,
            })
            .args(arbiter::instruction::InitClerk { limit })
            .signer(signer.as_ref()),
        vec!["arbiter::InitClerk"],
    )
}

fn process_show(
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
