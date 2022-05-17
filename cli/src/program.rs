use anchor_client::solana_sdk::commitment_config::CommitmentConfig;
use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::solana_sdk::signature::Keypair;
use anchor_client::{Client, Program, RequestBuilder};
use anyhow::Result;
use std::rc::Rc;

use super::config::Config;
use super::terminal::{request_approval, Spinner};

/// Checks whether the account for the argued public key exists.
pub fn account_exists(program: &Program, public_key: &Pubkey) -> Result<bool> {
    let client = program.rpc();
    let info = client.get_account_with_commitment(public_key, client.commitment())?;
    Ok(info.value.is_some())
}

/// Handle the instantiation of a program client and the
/// designating signer keypair for the argued config and program ID.
pub fn create_program_client(config: &Config) -> (Program, Rc<Keypair>) {
    (
        Client::new_with_options(
            config.cluster.clone(),
            config.keypair.clone(),
            CommitmentConfig::confirmed(),
        )
        .program(config.program_id),
        config.keypair.clone(),
    )
}

/// Wrap a sendable transaction expression to be
/// sent, confirmed and log the signature hash based on the
/// detected verbosity setting in the exposed configuration.
pub fn send_with_approval(config: &Config, req: RequestBuilder, ix_names: Vec<&str>) -> Result<()> {
    request_approval(config, Some(ix_names))?;

    let sp = Spinner::new("Sending transaction");
    let sig = req.send()?;
    sp.finish_with_message("Transaction confirmed!");

    if config.verbose {
        println!("Signature: {}", sig);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use anchor_client::solana_sdk::signer::Signer;
    use anchor_client::solana_sdk::system_program;
    use anchor_client::Cluster;

    use super::*;
    use crate::config::Config;

    #[test]
    fn program_client_creates_instance() {
        let config = Config::default();
        let signer_pubkey = config.keypair.pubkey();
        let p = create_program_client(&config);

        assert_eq!(p.0.id(), Pubkey::default());
        assert_eq!(p.0.payer(), signer_pubkey);
        assert_eq!(p.1.pubkey(), signer_pubkey);
    }

    #[test]
    fn account_exists_finds_real_pubkey() {
        let cfg = Config {
            cluster: Cluster::Mainnet,
            ..Default::default()
        };
        let (program, _) = create_program_client(&cfg);
        assert!(account_exists(&program, &system_program::ID).unwrap_or(false));
    }

    #[test]
    fn account_exists_doesnt_find_bad_pubkey() {
        let cfg = Config {
            cluster: Cluster::Mainnet,
            ..Default::default()
        };
        let (program, _) = create_program_client(&cfg);
        assert!(account_exists(&program, &Pubkey::default()).unwrap_or(false));
    }
}
