import { Layout, Space, Tag, Typography } from 'antd'
import type { CSSProperties, FunctionComponent } from 'react'
import ConnectButton from './ConnectButton'

const Header: FunctionComponent = () => {
  return (
    <Layout.Header style={headerStyle}>
      <Typography.Title style={{ margin: 0, flexGrow: 1 }} level={3}>
        Arbiter
      </Typography.Title>
      <Space size="large">
        <ConnectButton />
        <Tag color="cyan">devnet</Tag>
      </Space>
    </Layout.Header>
  )
}

const headerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-end',
  alignItems: 'center',
  backgroundColor: 'transparent'
}

export default Header
