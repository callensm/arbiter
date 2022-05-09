import type { FunctionComponent } from 'react'
import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import { ClerkProvider, DocumentsProvider, ProgramProvider } from '../lib/context'

import '@solana/wallet-adapter-react-ui/styles.css'
import '../styles/custom-styles.less'

const DynamicWalletConnectionProvider = dynamic(
  () => import('../components/WalletConnectionProvider'),
  {
    ssr: false
  }
)

const HashuSignApp: FunctionComponent<AppProps> = ({ Component, pageProps }) => {
  return (
    <DynamicWalletConnectionProvider test>
      <ProgramProvider>
        <ClerkProvider>
          <DocumentsProvider>
            <Component {...pageProps} />
          </DocumentsProvider>
        </ClerkProvider>
      </ProgramProvider>
    </DynamicWalletConnectionProvider>
  )
}

export default HashuSignApp
