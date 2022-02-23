import type { IdlAccounts, ProgramAccount } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { createContext, type FunctionComponent, useContext, useEffect, useState } from 'react'
import { useProgram } from './program'
import { Hashusign } from '../hashusign'
import { getClerkProgramAddress } from '../util'
import { notifyClerkFetchError } from '../notifications'

export type Clerk = IdlAccounts<Hashusign>['clerk']

export interface ClerkContextState {
  clerk: ProgramAccount<Clerk> | null
}

export const ClerkContext = createContext<ClerkContextState>({} as ClerkContextState)

export const ClerkProvider: FunctionComponent = ({ children }) => {
  const { program } = useProgram()
  const { publicKey } = useWallet()

  const [clerkKey, setClerkKey] = useState<PublicKey | null>(null)
  const [clerk, setClerk] = useState<ProgramAccount<Clerk> | null>(null)

  useEffect(() => {
    if (!publicKey) return

    getClerkProgramAddress(publicKey, program.programId)
      .then(([key]: [PublicKey, number]) => setClerkKey(key))
      .catch(console.error)
  }, [program, publicKey])

  useEffect(() => {
    if (!clerkKey) return

    program.account.clerk
      .fetchNullable(clerkKey)
      .then(c => {
        if (c) {
          setClerk({ account: c as Clerk, publicKey: clerkKey })
        }
      })
      .catch(notifyClerkFetchError)
  }, [program, clerkKey])

  return <ClerkContext.Provider value={{ clerk }}>{children}</ClerkContext.Provider>
}

/**
 * Custom React hook to provide the possible state
 * of the user's `Clerk` PDA account.
 * @returns {ClerkContextState}
 */
export const useClerk = (): ClerkContextState => {
  return useContext(ClerkContext)
}
