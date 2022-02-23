import { WalletOutlined } from '@ant-design/icons'
import { WalletNotConnectedError } from '@solana/wallet-adapter-base'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Button, Space } from 'antd'
import { type FunctionComponent, useCallback, useMemo } from 'react'
import { notifyWalletConnectionStatus } from '../../lib/notifications'
import { truncatePublicKey } from '../../lib/util'

const ConnectButton: FunctionComponent = () => {
  const modal = useWalletModal()
  const { wallet, disconnect, connect, publicKey, connected, connecting } = useWallet()

  const handleOpenModal = useCallback(() => modal.setVisible(true), [modal])

  const handleConnectToWallet = useCallback(async () => {
    if (!wallet) throw new WalletNotConnectedError()

    try {
      await connect()
      notifyWalletConnectionStatus(true)
    } catch (err) {
      console.error(err)
    }
  }, [wallet, connect])

  const handleResetWallet = useCallback(async () => {
    try {
      if (wallet) {
        await disconnect()
        notifyWalletConnectionStatus(false)
      }
    } catch (err) {
      console.error(err)
    }
  }, [wallet, disconnect])

  const walletIcon = useMemo(
    () => (
      <img
        id='wallet-btn-icon'
        src={wallet?.adapter.icon || ''}
        alt='wallet-icon'
        height='90%'
        width='90%'
      />
    ),
    [wallet]
  )

  return (
    <>
      {wallet ? (
        <Space>
          {publicKey && connected ? (
            <Button type='primary' icon={<WalletOutlined />}>
              {truncatePublicKey(publicKey.toBase58())}
            </Button>
          ) : (
            <Button
              style={{ display: 'flex' }}
              type='primary'
              icon={walletIcon}
              loading={connecting}
              onClick={handleConnectToWallet}
            >
              Connect
            </Button>
          )}
          <Button onClick={handleResetWallet}>Disconnect</Button>
        </Space>
      ) : (
        <Button type='primary' icon={<WalletOutlined />} onClick={handleOpenModal}>
          Select Wallet
        </Button>
      )}
    </>
  )
}

export default ConnectButton
