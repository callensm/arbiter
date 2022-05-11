import { Program, AnchorProvider } from '@project-serum/anchor'
import { type AnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { createContext, type FunctionComponent, useContext, useMemo } from 'react'
import { type Arbiter, IDL } from '../idl'

export const PROGRAM_ID = new PublicKey('Hashu8jdNgYcv7d3Xqm59uuh9r3Q73t5fYQ8Bn5FkiNW')

export interface ProgramContextState {
  program: Program<Arbiter>
}

export const ProgramContext = createContext<ProgramContextState>({} as ProgramContextState)

export const ProgramProvider: FunctionComponent = ({ children }) => {
  const { connection } = useConnection()
  const { publicKey, signTransaction, signAllTransactions } = useWallet()

  const anchorWallet = useMemo(
    () => ({
      publicKey,
      signTransaction,
      signAllTransactions
    }),
    [publicKey, signTransaction, signAllTransactions]
  )

  const program = useMemo(() => {
    const provider = new AnchorProvider(connection, anchorWallet as AnchorWallet, {})
    return new Program<Arbiter>(IDL, PROGRAM_ID, provider)
  }, [connection, anchorWallet])

  return <ProgramContext.Provider value={{ program }}>{children}</ProgramContext.Provider>
}

/**
 * Custom React hook for the `Program` context state
 * @returns {ProgramContextState}
 */
export const useProgram = (): ProgramContextState => {
  return useContext(ProgramContext)
}
