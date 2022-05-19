use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::solana_sdk::signer::Signer;
use anchor_client::solana_sdk::system_program;
use anyhow::Result;
use clap::Subcommand;

use crate::config::Config;
use crate::macros::{assert_exists, assert_not_exists};
use crate::program::{create_program_client, send_with_approval};
use crate::terminal::{print_serialized, DisplayOptions};

#[derive(Subcommand)]
pub enum DocumentCommand {
    Create {
        #[clap(short, long, multiple_occurrences = true)]
        participant: Vec<Pubkey>,
        #[clap(long)]
        title: String,
        #[clap(long)]
        uri: String,
    },
    Finalize {
        address: Pubkey,
    },
    Get {
        address: Option<Pubkey>,
        #[clap(long)]
        json: bool,
        #[clap(long, conflicts_with = "address")]
        owner: Option<Pubkey>,
        #[clap(long)]
        pretty: bool,
    },
    Sign {
        address: Pubkey,
    },
}

pub fn entry(cfg: &Config, subcmd: &DocumentCommand) -> Result<()> {
    match subcmd {
        DocumentCommand::Create {
            participant,
            title,
            uri,
        } => process_create(cfg, participant, title, uri),
        DocumentCommand::Finalize { address } => process_finalize(cfg, address),
        DocumentCommand::Get {
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
        DocumentCommand::Sign { address } => process_sign(cfg, address),
    }
}

fn process_create(cfg: &Config, participants: &[Pubkey], title: &str, uri: &str) -> Result<()> {
    let (program, signer) = create_program_client(cfg);

    let clerk_addr = Pubkey::find_program_address(
        &[arbiter::seeds::CLERK, signer.pubkey().as_ref()],
        &program.id(),
    )
    .0;

    let doc_addr = Pubkey::find_program_address(
        &[
            arbiter::seeds::DOCUMENT,
            signer.pubkey().as_ref(),
            arbiter::state::Document::title_seed(title),
        ],
        &program.id(),
    )
    .0;

    assert_not_exists!(&program, arbiter::state::Document, &doc_addr);

    send_with_approval(
        cfg,
        program
            .request()
            .accounts(arbiter::accounts::InitDocument {
                authority: signer.pubkey(),
                payer: signer.pubkey(),
                clerk: clerk_addr,
                document: doc_addr,
                system_program: system_program::ID,
            })
            .args(arbiter::instruction::InitDocument {
                title: title.into(),
                uri: uri.into(),
                participants: participants.to_vec(),
            })
            .signer(signer.as_ref()),
        vec!["arbiter::InitDocument"],
    )
}

fn process_finalize(cfg: &Config, address: &Pubkey) -> Result<()> {
    let (program, signer) = create_program_client(cfg);

    assert_exists!(&program, arbiter::state::Document, address);

    let clerk = Pubkey::find_program_address(
        &[arbiter::seeds::CLERK, signer.pubkey().as_ref()],
        &program.id(),
    )
    .0;

    send_with_approval(
        cfg,
        program
            .request()
            .accounts(arbiter::accounts::Finalize {
                authority: signer.pubkey(),
                payer: signer.pubkey(),
                clerk,
                document: *address,
            })
            .args(arbiter::instruction::Finalize {})
            .signer(signer.as_ref()),
        vec!["arbiter::Finalize"],
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

fn process_sign(cfg: &Config, address: &Pubkey) -> Result<()> {
    let (program, signer) = create_program_client(cfg);

    assert_exists!(&program, arbiter::state::Document, address);

    send_with_approval(
        cfg,
        program
            .request()
            .accounts(arbiter::accounts::AddSignature {
                participant: signer.pubkey(),
                document: *address,
            })
            .args(arbiter::instruction::AddSignature {})
            .signer(signer.as_ref()),
        vec!["arbiter::AddSignature"],
    )
}
