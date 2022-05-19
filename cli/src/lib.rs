use anyhow::Result;
use clap::{AppSettings, Parser};

mod cmd;
mod config;
mod macros;
mod program;
mod terminal;

use cmd::*;
use config::{Config, Overrides};

#[derive(Parser)]
#[clap(version, propagate_version = true)]
#[clap(global_setting(AppSettings::DeriveDisplayOrder))]
pub struct Opts {
    #[clap(flatten)]
    cfg: Overrides,
    #[clap(subcommand)]
    cmd: Command,
}

#[derive(Parser)]
enum Command {
    Clerk {
        #[clap(subcommand)]
        subcmd: clerk::ClerkCommand,
    },
    Document {
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
