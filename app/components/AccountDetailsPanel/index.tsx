import { UserAddOutlined } from '@ant-design/icons'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button, Card, Typography } from 'antd'
import { useCallback, useState, type FunctionComponent } from 'react'
import { useClerk, useProgram } from '../../lib/context'
import { notifySolScan, notifyTransactionError } from '../../lib/notifications'
import { getDocumentProgramAddress } from '../../lib/util'

const AccountDetailsPanel: FunctionComponent = () => {
  const clerk = useClerk()
  const { program } = useProgram()
  const { connected, publicKey } = useWallet()

  const [loading, setLoading] = useState(false)

  const handleCreateClerk = useCallback(async () => {
    if (!connected || !publicKey || !clerk.publicKey) return

    setLoading(true)

    try {
      const sig = await program.methods
        .initClerk(5)
        .accounts({
          authority: publicKey,
          clerk: clerk.publicKey,
          payer: publicKey
        })
        .rpc()

      await program.provider.connection.confirmTransaction(sig, 'confirmed')
      notifySolScan(sig, 'devnet')

      await clerk.refresh()
    } catch (err) {
      notifyTransactionError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [program, clerk, connected, publicKey])

  const handleNewDocument = useCallback(async () => {
    if (!connected || !publicKey || !clerk.publicKey) return

    setLoading(true)

    try {
      const title = 'My First Document'
      const [documentPublicKey] = await getDocumentProgramAddress(title, publicKey)

      const sig = await program.methods
        .initDocument(title, [publicKey])
        .accounts({
          authority: publicKey,
          payer: publicKey,
          clerk: clerk.publicKey,
          document: documentPublicKey
        })
        .rpc()

      await program.provider.connection.confirmTransaction(sig, 'confirmed')
      notifySolScan(sig, 'devnet')

      await clerk.refresh()
    } catch (err) {
      notifyTransactionError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [program, clerk, connected, publicKey])

  return (
    <Card style={{ borderRadius: 10 }}>
      {clerk.publicKey && clerk.data ? (
        <>
          <span>{clerk.publicKey.toBase58()}</span>
          <Button loading={loading} onClick={handleNewDocument}>
            New Document
          </Button>
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <Typography.Title level={2}>
            {connected ? 'First Visit?' : 'Connect Your Wallet'}
          </Typography.Title>
          <Typography.Paragraph>
            To get started, initialize your `Clerk` program account.
          </Typography.Paragraph>
          <Button
            type="primary"
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
