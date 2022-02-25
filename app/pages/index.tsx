import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { Col, Layout, Row, Table, TableColumnsType, Tooltip } from 'antd'
import type { NextPage } from 'next'
import Head from 'next/head'
import { type CSSProperties, useEffect, useState } from 'react'
import AccountDetailsPanel from '../components/AccountDetailsPanel'
import Header from '../components/Header'
import { useDocuments } from '../lib/context'
import { type DocumentTableRow, generateDocumentTableData } from '../lib/util'

const { Content } = Layout

const documentTableRowColumns: TableColumnsType<DocumentTableRow> = [
  {
    title: 'Title',
    dataIndex: 'title',
    key: 'title'
  },
  {
    title: 'Participants',
    dataIndex: 'participants',
    key: 'participants'
  },
  {
    title: 'Signatures',
    dataIndex: 'signatures',
    key: 'signatures'
  },
  {
    title: 'Last Updated',
    dataIndex: 'lastUpdated',
    key: 'lastUpdated'
  },
  {
    title: 'Finalized',
    dataIndex: 'finalized',
    key: 'finalized',
    render: (val: string | null) =>
      val ? (
        <Tooltip title={val}>
          <CheckCircleFilled style={{ color: '#45FF4A' }} />
        </Tooltip>
      ) : (
        <CloseCircleFilled style={{ color: '#FF4545' }} />
      )
  }
]

const HomePage: NextPage = () => {
  const { documents } = useDocuments()

  const [tableRows, setTableRows] = useState<DocumentTableRow[] | null>(null)

  useEffect(() => {
    setTableRows(generateDocumentTableData(documents))
  }, [documents])

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
              <Table
                loading={!tableRows}
                dataSource={tableRows ?? []}
                columns={documentTableRowColumns}
              />
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
