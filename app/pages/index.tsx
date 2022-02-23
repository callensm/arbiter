import { UserAddOutlined } from '@ant-design/icons'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { Button, Card, Col, Layout, List, Row, Typography } from 'antd'
import type { NextPage } from 'next'
import Head from 'next/head'
import AccountDetailsPanel from '../components/AccountDetailsPanel'
import Header from '../components/Header'
import { useClerk } from '../lib/context'

const { Content } = Layout

const HomePage: NextPage = () => {
  const { clerk } = useClerk()
  const { connected } = useWallet()

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
          <Row>
            <Col span={24}>
              <AccountDetailsPanel clerk={clerk} connected={connected} />
              <Card>
                {clerk ? (
                  <>{clerk.publicKey}</>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <Typography.Title level={2}>
                      {connected ? 'First Visit?' : 'Connect Your Wallet'}
                    </Typography.Title>
                    <Typography.Paragraph>
                      To get started, initialize your `Clerk` program account.
                    </Typography.Paragraph>
                    <Button type='primary' icon={<UserAddOutlined />}>
                      Create
                    </Button>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <List dataSource={[]} />
            </Col>
          </Row>
        </Content>
      </Layout>
    </>
  )
}

export default HomePage
