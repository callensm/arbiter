import { BN, type ProgramAccount } from '@project-serum/anchor'
import { PublicKey } from '@solana/web3.js'
import { type Document, PROGRAM_ID } from './context'
import { IDL } from './idl'

export type DocumentTableRow = {
  key: string
  title: string
  participants: string[]
  signatures: number
  lastUpdated: string
  finalized: boolean
}

const seeds: Record<'clerk' | 'document' | 'mint' | 'staged', string> = {
  clerk: IDL.constants[0].value.replace(/[b"]/g, ''),
  document: IDL.constants[1].value.replace(/[b"]/g, ''),
  mint: IDL.constants[2].value.replace(/[b"]/g, ''),
  staged: IDL.constants[3].value.replace(/[b"]/g, '')
}

/**
 * Convert the argued `BN` as a UNIX timestamp into the locale
 * date-time string for the user.
 * @param {BN | number} unix
 * @returns {string}
 */
export const convertToLocaleDate = (unix: BN | number): string =>
  new Date((unix instanceof BN ? unix.toNumber() : unix) * 1000).toLocaleString()

/**
 * Truncates the argued document title to 32 bytes and converts
 * the string into a `Buffer` to be used as an address seed.
 * @param {string} title
 * @returns {Buffer}
 */
const createDocumentTitleSeed = (title: string): Buffer =>
  title.length > 32 ? Buffer.from(title.slice(0, 32)) : Buffer.from(title)

/**
 * Converts the argued array of document program accounts into
 * data entry rows for the table component that will visualize them.
 * @param {ProgramAccount<Document>[]} documents
 * @returns {DocumentTableRow[]}
 */
export const generateDocumentTableData = (
  documents: ProgramAccount<Document>[]
): DocumentTableRow[] => {
  return documents.map<DocumentTableRow>(doc => ({
    key: doc.publicKey.toBase58(),
    title: doc.account.title,
    participants: doc.account.participants.map(key => key.toBase58()),
    signatures: doc.account.timestamps.filter(t => !t.isZero()).length,
    lastUpdated: convertToLocaleDate(
      Math.max(doc.account.createdAt.toNumber(), ...doc.account.timestamps.map(t => t.toNumber()))
    ),
    finalized: !doc.account.finalizationTimestamp.isZero()
  }))
}

/**
 * Derive the public key and bump nonce of a `Clerk`
 * program account.
 * @param {PublicKey} authority
 * @returns {Promise<[PublicKey, number]>}
 */
export const getClerkProgramAddress = (authority: PublicKey): Promise<[PublicKey, number]> =>
  PublicKey.findProgramAddress([Buffer.from(seeds.clerk), authority.toBytes()], PROGRAM_ID)

/**
 * Derive the public key and bump nonce of a `Document`
 * program account.
 * @param {string} title
 * @param {PublicKey} authority
 * @returns {Promise<[PublicKey, number]>}
 */
export const getDocumentProgramAddress = (
  title: string,
  authority: PublicKey
): Promise<[PublicKey, number]> =>
  PublicKey.findProgramAddress(
    [Buffer.from(seeds.document), authority.toBytes(), createDocumentTitleSeed(title)],
    PROGRAM_ID
  )

/**
 * Truncates the argued base-58 key to the first
 * and last 5 characters of the string.
 * @param {string} key
 * @returns {string}
 */
export const truncatePublicKey = (key: string): string =>
  `${key.substring(0, 5)}...${key.substring(key.length - 5)}`
