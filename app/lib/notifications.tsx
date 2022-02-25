import { PublicKey, type Cluster } from '@solana/web3.js'
import { notification } from 'antd'

/**
 * Display an Antd error notification for fetching
 * clerk data from on-chain
 * @param {Error} err
 */
export function notifyClerkFetchError(err: Error) {
  console.error(err)
  notification.error({
    message: 'Clerk Fetch Error',
    description: (err as Error).message,
    placement: 'bottomLeft',
    duration: 10
  })
}

/**
 * Display an Antd error notification for fetching
 * clerk's document list data from on-chain
 * @param {Error} err
 */
export function notifyDocumentsFetchError(err: Error) {
  console.error(err)
  notification.error({
    message: 'Clerk Documents Fetch Error',
    description: (err as Error).message,
    placement: 'bottomLeft',
    duration: 10
  })
}

/**
 * Displays an Antd error notification for a Document
 * public key that was fetched and returned `null`.
 * @param {PublicKey} pubkey
 */
export function notifyDocumentNotFoundError(pubkey: PublicKey) {
  console.error(`Document not found: ${pubkey.toBase58()}`)
  notification.error({
    message: 'Document Not Found',
    description: `${pubkey.toBase58()} could not be found as a valid Document program account`,
    placement: 'bottomLeft',
    duration: 10
  })
}

/**
 * Display an Antd success notification with a link
 * to the transaction signature on SolScan
 * @param {string} signature
 * @param {Cluster | undefined} [cluster]
 */
export function notifySolScan(signature: string, cluster?: Cluster) {
  let clusterParam: string = ''
  if (cluster) {
    clusterParam = `?cluster=${cluster}`
  }

  notification.success({
    message: 'Transaction Success',
    description: (
      <a
        target='_blank'
        rel='noreferrer'
        href={`https://solscan.io/tx/${signature}${clusterParam}`}
      >
        View on SolScan
      </a>
    ),
    placement: 'bottomLeft',
    duration: 10
  })
}

/**
 * Display an Antd error notification with the
 * transaction error message for the user to see
 * @param {Error} err
 */
export function notifyTransactionError(err: Error) {
  console.error(err)
  notification.error({
    message: 'Transaction Error',
    description: (err as Error).message,
    placement: 'bottomLeft',
    duration: 10
  })
}

/**
 * Displays an Antd notification alerting the user of
 * connection status changes with their browser wallet
 * @param {boolean} connected
 */
export function notifyWalletConnectionStatus(connected: boolean) {
  connected
    ? notification.success({
        message: 'Wallet Connected',
        placement: 'bottomLeft',
        duration: 10
      })
    : notification.warning({
        message: 'Wallet Disconnected',
        placement: 'bottomLeft',
        duration: 10
      })
}
