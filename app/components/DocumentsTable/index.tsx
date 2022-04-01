import {
  CheckCircleFilled,
  CloseCircleFilled,
  EyeOutlined,
  KeyOutlined,
  LinkOutlined
} from '@ant-design/icons'
import { Button, message, Table, type TableColumnsType } from 'antd'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, type FunctionComponent } from 'react'
import { useDocuments } from '../../lib/context'
import { generateDocumentTableData, type DocumentTableRow } from '../../lib/util'

const LazyDocumentModal = dynamic(() => import('./DocumentModal'))

const DocumentsTable: FunctionComponent = () => {
  const { documents } = useDocuments()

  const [rows, setRows] = useState<DocumentTableRow[] | null>(null)
  const [viewDocument, setViewDocument] = useState<number | null>(null)

  useEffect(() => {
    setRows(generateDocumentTableData(documents))
  }, [documents])

  const handleOnModalClose = useCallback(() => {
    setViewDocument(null)
  }, [])

  const columns: TableColumnsType<DocumentTableRow> = useMemo(
    () => [
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
        key: 'signatures',
        render: (val: number, record: DocumentTableRow) => `${val} of ${record.participants.length}`
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
        render: (val: boolean) =>
          val ? (
            <CheckCircleFilled style={{ color: '#45FF4A' }} />
          ) : (
            <CloseCircleFilled style={{ color: '#FF4545' }} />
          )
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_val: any, record: DocumentTableRow, i: number) => (
          <Button.Group>
            <Link href={`/sign/${record.key}`}>
              <Button type="link" icon={<KeyOutlined />} />
            </Link>
            <Button
              type="link"
              icon={<EyeOutlined style={{ fontSize: '1.25em' }} />}
              onClick={() => setViewDocument(i)}
            />
            <Button
              type="link"
              icon={<LinkOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/sign/${record.key}`)
                message.info({
                  content: 'Signing link copied!',
                  duration: 2
                })
              }}
            />
          </Button.Group>
        )
      }
    ],
    []
  )

  return (
    <>
      <Table loading={!rows} dataSource={rows ?? []} columns={columns} />
      <LazyDocumentModal
        index={viewDocument ?? 0}
        documents={documents}
        visible={viewDocument !== null}
        onClose={handleOnModalClose}
      />
    </>
  )
}

export default DocumentsTable
