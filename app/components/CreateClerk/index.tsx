import { AuditOutlined } from '@ant-design/icons'
import { useWallet } from '@solana/wallet-adapter-react'
import { SystemProgram } from '@solana/web3.js'
import { Button } from 'antd'
import { useCallback, useState, type FunctionComponent } from 'react'
import { useProgram } from '../../lib/context'
import { notifySolScan, notifyTransactionError } from '../../lib/notifications'
import { getClerkProgramAddress } from '../../lib/util'

const CreateClerk: FunctionComponent = () => {
  const { program } = useProgram()
  const { publicKey, sendTransaction } = useWallet()

  const [limit, setLimit] = useState(5) // TODO: FIXME:
  const [loading, setLoading] = useState(false)

  const handleOnClick = useCallback(async () => {
    if (!publicKey) return

    try {
      setLoading(true)

      const [clerk] = await getClerkProgramAddress(publicKey, program.programId)

      let tx = program.transaction.initClerk(limit, {
        accounts: {
          authority: publicKey,
          payer: publicKey,
          clerk,
          systemProgram: SystemProgram.programId
        }
      })

      const sig = await sendTransaction(tx, program.provider.connection)
      await program.provider.connection.confirmTransaction(sig)

      notifySolScan(sig, 'devnet')
    } catch (err) {
      notifyTransactionError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [limit, publicKey])

  return (
    <div>
      <Button icon={<AuditOutlined />} onClick={handleOnClick}>
        Create Your Clerk
      </Button>
    </div>
  )
}

export default CreateClerk
