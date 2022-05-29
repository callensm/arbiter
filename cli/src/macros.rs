/// Macro to assert that the argued public key exists on chain.
///
/// Performs an `RpcClient::get_account_with_commitment` call for
/// confirmed accounts using the provided program and public key
/// and will return an error if the account is not found or there
/// is an RPC call error during the process.
///
/// # Example
///
/// ```
/// let program = program_client!(config, jet_staking::ID);
/// let stake_account = find_staking_address(&pool, &owner);
/// assert_exists!(program, jet_staking::state::StakeAccount, &stake_account);
/// ```
///
/// You can also provide a fallback block of code to execute in-place
/// of throwing an error on a bad assertion:
///
/// ```
/// let program = program_client!(config, jet_staking::ID);
/// let stake_account = find_staking_address(&pool, &owner);
/// assert_exists!(
///     program,
///     jet_staking::state::StakeAccount,
///     &stake_account,
///     {
///         println!("my fallback code block");
///     },
/// );
/// ```
macro_rules! assert_exists {
    ($program:expr, $acc_type:ty, $pubkey:expr $(,)?) => {{
        if !crate::program::account_exists($program, $pubkey)? {
            return Err(anyhow::anyhow!(
                "{} {} does not exist",
                std::any::type_name::<$acc_type>(),
                $pubkey
            ));
        }
    }};

    ($program:expr, $acc_type:ty, $pubkey:expr, $fallback:block $(,)?) => {{
        if !crate::program::account_exists($program, $pubkey)? {
            eprintln!(
                "{} {} does not exist",
                std::any::type_name::<$acc_type>(),
                $pubkey,
            );
            $fallback
        }
    }};
}
pub(crate) use assert_exists;

/// Macro to assert that the argued public key does not exist on chain.
///
/// Performs an `RpcClient::get_account_with_commitment` call for confirmed
/// accounts using the provided public key and returns an error if
/// the account is found or there is an RPC call error.
///
/// # Example
///
/// ```
/// let program = program_client!(config, jet_staking::ID);
/// let stake_account = find_staking_address(&pool, &owner);
/// assert_not_exists!(program, jet_staking::state::StakeAccount, &stake_account);
/// ```
///
/// You can also provide a fallback block of code to execute in-place
/// of throwing an error on a bad assertion:
///
/// ```
/// let program = program_client!(config, jet_staking::ID);
/// let stake_account = find_staking_address(&pool, &owner);
/// assert_not_exists!(
///     program,
///     jet_staking::state::StakeAccount,
///     &stake_account,
///     {
///         println!("my fallback code block");
///     },
/// );
/// ```
macro_rules! assert_not_exists {
    ($program:expr, $acc_type:ty, $pubkey:expr $(,)?) => {{
        if crate::program::account_exists($program, $pubkey)? {
            return Err(anyhow::anyhow!(
                "{} {} already exists",
                std::any::type_name::<$acc_type>(),
                $pubkey
            ));
        }
    }};

    ($program:expr, $acc_type:ty, $pubkey:expr, $fallback:block $(,)?) => {{
        if crate::program::account_exists($program, $pubkey)? {
            eprintln!(
                "{} {} already exists",
                std::any::type_name::<$acc_type>(),
                $pubkey,
            );

            $fallback
        }
    }};
}
pub(crate) use assert_not_exists;
