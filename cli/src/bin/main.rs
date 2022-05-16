use anyhow::Result;
use arbiter_cli::Opts;
use clap::Parser;

fn main() -> Result<()> {
    arbiter_cli::run(Opts::parse())
}
