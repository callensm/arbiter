import type { IdlAccounts } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  createContext,
  type FunctionComponent,
  useContext,
  useEffect,
  useState,
  useCallback
} from 'react'
import { useProgram } from './program'
import type { Hashusign } from '../idl'
import { getClerkProgramAddress } from '../util'
import { notifyClerkFetchError } from '../notifications'
import { PublicKey } from '@solana/web3.js'

export type Clerk = IdlAccounts<Hashusign>['clerk']

export interface ClerkContextState {
  data: Clerk | null
  publicKey: PublicKey | null
  refresh: () => Promise<void>
}

export const ClerkContext = createContext<ClerkContextState>({} as ClerkContextState)

export const ClerkProvider: FunctionComponent = ({ children }) => {
  const { program } = useProgram()
  const { publicKey: walletPublicKey } = useWallet()

  const [publicKey, setPublicKey] = useState<PublicKey | null>(null)
  const [data, setData] = useState<Clerk | null>(null)

  const refresh = useCallback(async () => {
    if (!walletPublicKey) return

    try {
      const [pk] = await getClerkProgramAddress(walletPublicKey)
      setPublicKey(pk)

      const c = await program.account.clerk.fetchNullable(pk)
      if (c) setData(c as Clerk)
    } catch (err) {
      notifyClerkFetchError(err as Error)
    }
  }, [program, walletPublicKey])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <ClerkContext.Provider value={{ data, publicKey, refresh }}>{children}</ClerkContext.Provider>
  )
}

/**
 * Custom React hook to provide the possible state
 * of the user's `Clerk` PDA account.
 * @returns {ClerkContextState}
 */
export const useClerk = (): ClerkContextState => {
  return useContext(ClerkContext)
}
