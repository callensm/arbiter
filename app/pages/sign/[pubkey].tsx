import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PublicKey } from '@solana/web3.js'
import { Layout } from 'antd'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Header from '../../components/Header'
import { type Document, useProgram } from '../../lib/context'
import { notifyDocumentNotFoundError } from '../../lib/notifications'

const { Content } = Layout

const SignDocumentPage: NextPage = () => {
  const {
    query: { pubkey }
  } = useRouter()
  const { program } = useProgram()

  const [document, setDocument] = useState<Document | null>(null)

  useEffect(() => {
    program.account.document
      .fetchNullable(new PublicKey(pubkey as string))
      .then(setDocument)
      .catch(notifyDocumentNotFoundError)
  }, [pubkey])

  return (
    <>
      <Head>
        <title>Signature | HashuSign</title>
      </Head>
      <Layout>
        <WalletModalProvider>
          <Header />
        </WalletModalProvider>
        <Content style={{ padding: '3.5em' }}>
          <div>Pubkey: {pubkey}</div>
          {JSON.stringify(document, null, 2)}
        </Content>
      </Layout>
    </>
  )
}

export default SignDocumentPage
