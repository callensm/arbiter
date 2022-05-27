use anyhow::Result;
use clap::{AppSettings, Parser};

mod cmd;
mod config;
mod macros;
mod program;
mod terminal;

use cmd::*;
use config::{Config, Overrides};

/// Top-level command line options to be provided.
#[derive(Parser)]
#[clap(version, propagate_version = true)]
#[clap(global_setting(AppSettings::DeriveDisplayOrder))]
pub struct Opts {
    /// Configuration overrides to propagate to the subcommand handler.
    #[clap(flatten)]
    cfg: Overrides,
    /// The subcommand to process.
    #[clap(subcommand)]
    cmd: Command,
}

/// The variants for each subcommand group to attach to the top-level handler.
#[derive(Parser)]
enum Command {
    /// Interact with a clerk program account.
    Clerk {
        /// The subcommand to invoke on the clerk.
        #[clap(subcommand)]
        subcmd: clerk::ClerkCommand,
    },
    /// Interact with a document program account.
    Document {
        /// The subcommand to invoke on the document.
        #[clap(subcommand)]
        subcmd: document::DocumentCommand,
    },
}

pub fn run(opts: Opts) -> Result<()> {
    let cfg = Config::new(&opts.cfg)?;
    match opts.cmd {
        Command::Clerk { subcmd } => clerk::entry(&cfg, &subcmd),
        Command::Document { subcmd } => document::entry(&cfg, &subcmd),
    }
}
