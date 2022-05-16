use anyhow::Result;
use clap::{AppSettings, Parser};

#[derive(Debug, Parser)]
#[clap(version, propagate_version = true)]
#[clap(global_setting(AppSettings::DeriveDisplayOrder))]
pub struct Opts {
    #[clap(subcommand)]
    cmd: Command,
}

#[derive(Debug, Parser)]
enum Command {
    Test {},
}

pub fn run(opts: Opts) -> Result<()> {
    match opts.cmd {
        Command::Test {} => todo!(),
    }
}
