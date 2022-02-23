import { type ProgramAccount } from '@project-serum/anchor'
import { Card } from 'antd'
import { type FunctionComponent } from 'react'
import { type Clerk } from '../../lib/context'

interface AccountDetailsPanelProps {
  clerk: ProgramAccount<Clerk> | null
  connected: boolean
}

const AccountDetailsPanel: FunctionComponent<AccountDetailsPanelProps> = props => {
  return (
    <Card>
      <div>PLACEHOLDER</div>
    </Card>
  )
}

export default AccountDetailsPanel
