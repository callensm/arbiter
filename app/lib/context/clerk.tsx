import type { IdlAccounts } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import { createContext, type FunctionComponent, useContext, useEffect, useState } from 'react'
import { useProgram } from './program'
import type { Hashusign } from '../idl'
import { getClerkProgramAddress } from '../util'
import { notifyClerkFetchError } from '../notifications'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { getClerkSpace } from '@hashusign/wasm'

export type Clerk = IdlAccounts<Hashusign>['clerk']

export interface ClerkContextState {
  data: Clerk | null
  publicKey: PublicKey | null
  rent: number
}

export const ClerkContext = createContext<ClerkContextState>({} as ClerkContextState)

export const ClerkProvider: FunctionComponent = ({ children }) => {
  const { program } = useProgram()
  const { publicKey: walletPublicKey } = useWallet()

  const [publicKey, setPublicKey] = useState<PublicKey | null>(null)
  const [data, setData] = useState<Clerk | null>(null)
  const [rent, setRent] = useState(0)

  useEffect(() => {
    if (!walletPublicKey) return
    getClerkProgramAddress(walletPublicKey)
      .then(async ([clerkKey]) => {
        setPublicKey(clerkKey)
        const c = await program.account.clerk.fetchNullable(clerkKey)
        if (c) setData(c as Clerk)
      })
      .catch(notifyClerkFetchError)
  }, [program, walletPublicKey])

  useEffect(() => {
    if (!data) return
    program.provider.connection
      .getMinimumBalanceForRentExemption(getClerkSpace(data.documents.length))
      .then(amt => setRent(amt / LAMPORTS_PER_SOL))
      .catch(console.error)
  }, [data])

  return <ClerkContext.Provider value={{ data, publicKey, rent }}>{children}</ClerkContext.Provider>
}

/**
 * Custom React hook to provide the possible state
 * of the user's `Clerk` PDA account.
 * @returns {ClerkContextState}
 */
export const useClerk = (): ClerkContextState => {
  return useContext(ClerkContext)
}
