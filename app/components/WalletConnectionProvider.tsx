import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import {
  PhantomWalletAdapter,
  LedgerWalletAdapter,
  SolletWalletAdapter,
  SlopeWalletAdapter
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import { type FunctionComponent, useMemo } from 'react'

const supportedWallets = [
  new PhantomWalletAdapter(),
  new LedgerWalletAdapter(),
  new SolletWalletAdapter(),
  new SlopeWalletAdapter()
]

interface WalletConnectionProviderProps {
  test?: boolean
}

const WalletConnectionProvider: FunctionComponent<WalletConnectionProviderProps> = ({
  children,
  test
}) => {
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(
    () => (test ? 'http://localhost:8899' : clusterApiUrl(network)),
    [network]
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={supportedWallets}>{children}</WalletProvider>
    </ConnectionProvider>
  )
}

export default WalletConnectionProvider
