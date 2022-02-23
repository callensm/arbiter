import { Program, Provider } from '@project-serum/anchor'
import { type AnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react'
import { createContext, type FunctionComponent, useContext, useMemo } from 'react'
import { type Hashusign, IDL } from '../hashusign'

export const PROGRAM_ID: string = '7NSjhnPPnaP1bRocgazKQow3KXGky9MRErL1jZ5fAitj'

export interface ProgramContextState {
  program: Program<Hashusign>
}

export const ProgramContext = createContext<ProgramContextState>({} as ProgramContextState)

export const ProgramProvider: FunctionComponent = ({ children }) => {
  const { connection } = useConnection()
  const wallet = useWallet()

  const program = useMemo(() => {
    const provider = new Provider(connection, wallet as AnchorWallet, {})
    return new Program<Hashusign>(IDL, PROGRAM_ID, provider)
  }, [connection, wallet])

  return <ProgramContext.Provider value={{ program }}>{children}</ProgramContext.Provider>
}

/**
 * Custom React hook for the `Program` context state
 * @returns {ProgramContextState}
 */
export const useProgram = (): ProgramContextState => {
  return useContext(ProgramContext)
}
