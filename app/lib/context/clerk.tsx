import type { IdlAccounts, ProgramAccount } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import { createContext, type FunctionComponent, useContext, useEffect, useState } from 'react'
import { useProgram } from './program'
import { Hashusign } from '../idl'
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

  const [clerk, setClerk] = useState<ProgramAccount<Clerk> | null>(null)

  useEffect(() => {
    if (!publicKey) return

    getClerkProgramAddress(publicKey)
      .then(([clerkKey]) =>
        program.account.clerk.fetchNullable(clerkKey).then(c => {
          if (c) {
            setClerk({ account: c as Clerk, publicKey: clerkKey })
          }
        })
      )
      .catch(notifyClerkFetchError)
  }, [program, publicKey])

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
