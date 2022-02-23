import { PublicKey } from '@solana/web3.js'
import { IDL } from './hashusign'

const seeds: Record<'clerk' | 'document' | 'mint' | 'staged', string> = {
  clerk: IDL.constants[0].value.replace(/[b"]/g, ''),
  document: IDL.constants[1].value.replace(/[b"]/g, ''),
  mint: IDL.constants[2].value.replace(/[b"]/g, ''),
  staged: IDL.constants[3].value.replace(/[b"]/g, '')
}

/**
 * Derive the public key and bump nonce of a `Clerk`
 * program account.
 * @param {PublicKey} authority
 * @param {PublicKey} programId
 * @returns {Promise<[PublicKey, number]>}
 */
export const getClerkProgramAddress = (
  authority: PublicKey,
  programId: PublicKey
): Promise<[PublicKey, number]> =>
  PublicKey.findProgramAddress([Buffer.from(seeds.clerk), authority.toBytes()], programId)

/**
 * Truncates the argued base-58 key to the first
 * and last 5 characters of the string.
 * @param {string} key
 * @returns {string}
 */
export const truncatePublicKey = (key: string): string =>
  `${key.substring(0, 5)}...${key.substring(key.length - 5)}`
