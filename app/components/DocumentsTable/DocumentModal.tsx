import type { ProgramAccount } from '@project-serum/anchor'
import { Descriptions, Modal } from 'antd'
import { type FunctionComponent, useMemo } from 'react'
import type { Document } from '../../lib/context'
import { convertToLocaleDate } from '../../lib/util'
import DocumentModalTitle from './DocumentModalTitle'

const { Item } = Descriptions

interface DocumentModalProps {
  documents: ProgramAccount<Document>[]
  index: number
  onClose: () => void
  visible: boolean
}

const DocumentModal: FunctionComponent<DocumentModalProps> = props => {
  const doc = useMemo(() => props.documents[props.index], [props.documents, props.index])
  const title = useMemo(() => doc?.account.title ?? '', [doc])

  return (
    <Modal visible={props.visible} footer={null} onCancel={props.onClose} destroyOnClose>
      {doc && (
        <Descriptions title={<DocumentModalTitle text={title} />}>
          <Item label="Public Key">{doc.publicKey.toBase58()}</Item>
          <Item label="Authority">{doc.account.authority.toBase58()}</Item>
          <Item label="Creation">{convertToLocaleDate(doc.account.createdAt)}</Item>
          <Item label="Finalization">
            {doc.account.finalizationTimestamp.isZero() ? (
              <em>Pending</em>
            ) : (
              convertToLocaleDate(doc.account.finalizationTimestamp)
            )}
          </Item>
          <Item label="Participants">{doc.account.participants.map(p => p.toBase58())}</Item>
          <Item label="Signatures">{doc.account.timestamps.map(t => t.toNumber())}</Item>
        </Descriptions>
      )}
    </Modal>
  )
}

export default DocumentModal
