import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { Col, Layout, List, Row } from 'antd'
import type { NextPage } from 'next'
import Head from 'next/head'
import type { CSSProperties } from 'react'
import AccountDetailsPanel from '../components/AccountDetailsPanel'
import Header from '../components/Header'

const { Content } = Layout

const HomePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>HashuSign</title>
      </Head>
      <Layout>
        <WalletModalProvider>
          <Header />
        </WalletModalProvider>
        <Content style={{ padding: '3.5em' }}>
          <Row style={gridRowStyle}>
            <Col span={24}>
              <AccountDetailsPanel />
            </Col>
          </Row>
          <Row style={gridRowStyle}>
            <Col span={24}>
              <List dataSource={[]} />
            </Col>
          </Row>
        </Content>
      </Layout>
    </>
  )
}

const gridRowStyle: CSSProperties = {
  marginTop: '1em',
  marginBottom: '1em'
}

export default HomePage
