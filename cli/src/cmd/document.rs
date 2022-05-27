use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::solana_sdk::signer::Signer;
use anchor_client::solana_sdk::system_program;
use anyhow::Result;
use clap::Subcommand;

use crate::config::Config;
use crate::macros::{assert_exists, assert_not_exists};
use crate::program::{create_program_client, send_with_approval};
use crate::terminal::{print_serialized, DisplayOptions};

/// The variants for each document account command.
#[derive(Subcommand)]
pub enum DocumentCommand {
    /// Create a new document under the clerk.
    Create {
        /// The participant pubkeys to add.
        #[clap(short, long, multiple_occurrences = true)]
        participant: Vec<Pubkey>,
        /// Title of the new document.
        #[clap(long)]
        title: String,
        /// URI of the document content in storage.
        #[clap(long)]
        uri: String,
    },
    /// Attempt to finalize a fully signed document.
    Finalize {
        /// The pubkey of the document.
        address: Pubkey,
    },
    /// Get the serialized account data for a document.
    Get {
        /// The pubkey of the document program account.
        address: Pubkey,
        /// Display the serialized data as JSON.
        #[clap(long)]
        json: bool,
        /// Pretty print the serialized data.
        #[clap(long)]
        pretty: bool,
    },
    /// Sign a document program account.
    Sign {
        /// The pubkey of the document account to sign.
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
            pretty,
        } => process_get(cfg, address, DisplayOptions::from_args(*json, *pretty)),
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

fn process_get(cfg: &Config, address: &Pubkey, display: DisplayOptions) -> Result<()> {
    let (program, _) = create_program_client(cfg);

    print_serialized(
        program.account::<arbiter::state::Document>(*address)?,
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
