import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { Layout } from 'antd'
import type { NextPage } from 'next'
import Head from 'next/head'
import Header from '../components/Header'
import { useClerk } from '../lib/context'

const HomePage: NextPage = () => {
  const { clerk } = useClerk()

  return (
    <>
      <Head>
        <title>HashuSign</title>
      </Head>
      <Layout>
        <WalletModalProvider>
          <Header />
        </WalletModalProvider>
        <Layout.Content style={{ padding: '2em' }}>{JSON.stringify(clerk, null, 2)}</Layout.Content>
      </Layout>
    </>
  )
}

export default HomePage
