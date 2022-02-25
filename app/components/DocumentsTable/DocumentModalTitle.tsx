import { FileTextOutlined } from '@ant-design/icons'
import type { FunctionComponent } from 'react'

interface DocumentModalTitleProps {
  text: string
}

const DocumentModalTitle: FunctionComponent<DocumentModalTitleProps> = props => {
  return (
    <>
      <FileTextOutlined />
      <span style={{ marginLeft: '0.5em' }}>{props.text}</span>
    </>
  )
}

export default DocumentModalTitle
