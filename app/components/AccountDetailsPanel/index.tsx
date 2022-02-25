import { UserAddOutlined } from '@ant-design/icons'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { SystemProgram } from '@solana/web3.js'
import { Button, Card, Typography } from 'antd'
import { useCallback, useState, type FunctionComponent } from 'react'
import { useClerk, useProgram } from '../../lib/context'
import { notifySolScan, notifyTransactionError } from '../../lib/notifications'

const AccountDetailsPanel: FunctionComponent = () => {
  const clerk = useClerk()
  const { connection } = useConnection()
  const { program } = useProgram()
  const { connected, publicKey, sendTransaction } = useWallet()

  const [loading, setLoading] = useState(false)

  const handleCreateClerk = useCallback(async () => {
    if (!connected || !publicKey || !clerk.publicKey) return

    setLoading(true)

    try {
      const tx = program.transaction.initClerk(5, {
        accounts: {
          authority: publicKey,
          clerk: clerk.publicKey,
          payer: publicKey,
          systemProgram: SystemProgram.programId
        }
      })

      const sig = await sendTransaction(tx, connection)
      await connection.confirmTransaction(sig, 'confirmed')

      notifySolScan(sig, 'devnet')
    } catch (err) {
      console.error(err)
      notifyTransactionError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [clerk.publicKey, connected, publicKey])

  return (
    <Card style={{ borderRadius: 10 }}>
      {clerk.publicKey && clerk.data ? (
        <span>{clerk.publicKey.toBase58()}</span>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <Typography.Title level={2}>
            {connected ? 'First Visit?' : 'Connect Your Wallet'}
          </Typography.Title>
          <Typography.Paragraph>
            To get started, initialize your `Clerk` program account.
          </Typography.Paragraph>
          <Button
            type='primary'
            loading={loading}
            icon={<UserAddOutlined />}
            onClick={handleCreateClerk}
          >
            Create
          </Button>
        </div>
      )}
    </Card>
  )
}

export default AccountDetailsPanel
