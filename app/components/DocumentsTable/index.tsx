import { CheckCircleFilled, CloseCircleFilled, EyeOutlined } from '@ant-design/icons'
import { Button, Table, Tooltip, type TableColumnsType } from 'antd'
import { useCallback, useEffect, useMemo, useState, type FunctionComponent } from 'react'
import { useDocuments } from '../../lib/context'
import { generateDocumentTableData, type DocumentTableRow } from '../../lib/util'
import DocumentModal from './DocumentModal'

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
        render: (val: boolean) =>
          val ? (
            <Tooltip title={val}>
              <CheckCircleFilled style={{ color: '#45FF4A' }} />
            </Tooltip>
          ) : (
            <CloseCircleFilled style={{ color: '#FF4545' }} />
          )
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_val: any, _record: DocumentTableRow, i: number) => (
          <Button
            type="link"
            icon={<EyeOutlined style={{ fontSize: '1.25em' }} />}
            onClick={() => setViewDocument(i)}
          />
        )
      }
    ],
    []
  )

  return (
    <>
      <Table loading={!rows} dataSource={rows ?? []} columns={columns} />
      <DocumentModal
        index={viewDocument ?? 0}
        documents={documents}
        visible={viewDocument !== null}
        onClose={handleOnModalClose}
      />
    </>
  )
}

export default DocumentsTable
