import type { IdlAccounts, ProgramAccount } from '@project-serum/anchor'
import { PublicKey } from '@solana/web3.js'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type FunctionComponent
} from 'react'
import { useClerk } from './clerk'
import { useProgram } from './program'
import type { Hashusign } from '../idl'
import { notifyDocumentNotFoundError, notifyDocumentsFetchError } from '../notifications'

export type Document = IdlAccounts<Hashusign>['document']

export interface DocumentsContextState {
  documents: ProgramAccount<Document>[]
  refresh: () => Promise<void>
}

export const DocumentsContext = createContext<DocumentsContextState>({} as DocumentsContextState)

export const DocumentsProvider: FunctionComponent = ({ children }) => {
  const { data } = useClerk()
  const { program } = useProgram()

  const [documents, setDocuments] = useState<ProgramAccount<Document>[]>([])

  const refresh = useCallback(async () => {
    if (!data) return

    const validDocumentPubkeys = data.documents.filter(key => !key.equals(PublicKey.default))

    if (validDocumentPubkeys.length > 0) {
      try {
        const docs = await program.account.document.fetchMultiple(validDocumentPubkeys, 'confirmed')
        const foundDocs: ProgramAccount<Document>[] = []

        docs.forEach((d, i) => {
          if (!d) notifyDocumentNotFoundError(validDocumentPubkeys[i])
          else foundDocs.push({ account: d as Document, publicKey: validDocumentPubkeys[i] })
        })

        if (foundDocs.length > 0) setDocuments(foundDocs)
      } catch (err) {
        notifyDocumentsFetchError(err as Error)
      }
    }
  }, [program, data])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <DocumentsContext.Provider value={{ documents, refresh }}>{children}</DocumentsContext.Provider>
  )
}

/**
 * Custom React hook to provide the possible
 * state of a clerk's list of owned `Document`s.
 * @returns {DocumentsContextState}
 */
export const useDocuments = (): DocumentsContextState => {
  return useContext(DocumentsContext)
}
