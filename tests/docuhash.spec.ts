import {
  BN,
  Program,
  ProgramAccount,
  Provider,
  setProvider,
  web3,
  workspace
} from '@project-serum/anchor'
import { ASSOCIATED_TOKEN_PROGRAM_ID, MintLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { assert, use as chaiUse } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Docuhash } from '../target/types/docuhash'

chaiUse(chaiAsPromised)

describe('docuhash', async () => {
  setProvider(Provider.env())

  const program = workspace.Docuhash as Program<Docuhash>

  const authority = (program.provider.wallet as any).payer as web3.Keypair
  const participants = [...Array(4)].map(() => web3.Keypair.generate())

  const title = 'My Test Document'
  let clerk: web3.PublicKey
  let document: web3.PublicKey
  let mint: web3.PublicKey
  let nftTokenAccount: web3.PublicKey

  describe('users of the program should be able to', () => {
    describe('invoke `init_clerk` to create a Clerk program account for themselves', () => {
      before(async () => {
        ;[clerk] = await web3.PublicKey.findProgramAddress(
          [Buffer.from('clerk'), authority.publicKey.toBytes()],
          program.programId
        )
      })

      describe('except when it should fail because', () => {
        it('the document limit provided is zero', () => {
          assert.isRejected(
            program.simulate.initClerk(0, {
              accounts: {
                authority: authority.publicKey,
                payer: authority.publicKey,
                clerk,
                systemProgram: web3.SystemProgram.programId
              },
              signers: [authority]
            })
          )
        })
      })

      describe('but when the clerk is successfully created', () => {
        let clerkData: ProgramAccount<any>

        before(async () => {
          await program.rpc.initClerk(1, {
            accounts: {
              authority: authority.publicKey,
              payer: authority.publicKey,
              clerk,
              systemProgram: web3.SystemProgram.programId
            },
            signers: [authority]
          })
        })

        it('the clerk is initialized', async () => {
          const clerks = await program.account.clerk.all()
          assert.lengthOf(clerks, 1)

          clerkData = clerks[0]
          assert.isTrue(clerkData.publicKey.equals(clerk))
        })

        it('the document list is set to the proper size limit', () => {
          assert.lengthOf(clerkData.account.documents, 1)
        })
      })
    })

    describe('invoke `init_document` to create a new legal document', () => {
      before(async () => {
        ;[document] = await web3.PublicKey.findProgramAddress(
          [Buffer.from('document'), authority.publicKey.toBytes(), Buffer.from(title.slice(0, 32))],
          program.programId
        )
      })

      describe('unless the instruction fails because', () => {
        it('the document title is empty', async () => {
          const [badDoc] = await web3.PublicKey.findProgramAddress(
            [Buffer.from('document'), authority.publicKey.toBytes(), Buffer.from('')],
            program.programId
          )

          assert.isRejected(
            program.simulate.initDocument(
              '',
              participants.map(p => p.publicKey),
              {
                accounts: {
                  authority: authority.publicKey,
                  payer: authority.publicKey,
                  clerk,
                  document: badDoc,
                  systemProgram: web3.SystemProgram.programId
                },
                signers: [authority]
              }
            )
          )
        })

        it('the participants public key array is empty', () => {
          assert.isRejected(
            program.simulate.initDocument(title, [], {
              accounts: {
                authority: authority.publicKey,
                payer: authority.publicKey,
                clerk,
                document,
                systemProgram: web3.SystemProgram.programId
              },
              signers: [authority]
            })
          )
        })

        it('there are duplicate participant public keys', () => {
          assert.isRejected(
            program.simulate.initDocument(
              title,
              [...participants.map(p => p.publicKey), participants[0].publicKey],
              {
                accounts: {
                  authority: authority.publicKey,
                  payer: authority.publicKey,
                  clerk,
                  document,
                  systemProgram: web3.SystemProgram.programId
                },
                signers: [authority]
              }
            )
          )
        })
      })

      describe('but when the instruction is successful', () => {
        let docData: ProgramAccount<any>

        before(async () => {
          await program.rpc.initDocument(
            title,
            participants.map(p => p.publicKey),
            {
              accounts: {
                authority: authority.publicKey,
                payer: authority.publicKey,
                clerk,
                document,
                systemProgram: web3.SystemProgram.programId
              },
              signers: [authority]
            }
          )
        })

        it('the new document is initialized', async () => {
          const docs = await program.account.document.all()
          assert.lengthOf(docs, 1)

          docData = docs[0]
          assert.isTrue(docData.publicKey.equals(document))
        })

        describe('with its account data properly set', () => {
          it('public key references', () => {
            assert.isTrue(docData.account.authority.equals(authority.publicKey))
            assert.isTrue(docData.account.mint.equals(web3.PublicKey.default))
          })

          it('participants and timestamp defaults', () => {
            assert.lengthOf(docData.account.participants, 4)
            assert.deepEqual(
              docData.account.participants.map((p: web3.PublicKey) => p.toBase58()),
              participants.map(p => p.publicKey.toBase58())
            )

            assert.lengthOf(docData.account.timestamps, 4)
            assert.equal(
              docData.account.timestamps.reduce(
                (acc: number, curr: BN) => acc + curr.toNumber(),
                0
              ),
              0
            )
          })

          it('additional state data fields', () => {
            assert.equal(docData.account.finalizationTimestamp.toNumber(), 0)
            assert.equal(docData.account.mintBump, 0)
          })
        })

        it('and it will fail to create more documents after the clerk limit is met', async () => {
          const newTitle = 'My Next Document'
          const [newDocKey] = await web3.PublicKey.findProgramAddress(
            [
              Buffer.from('document'),
              authority.publicKey.toBytes(),
              Buffer.from(newTitle.slice(0, 32))
            ],
            program.programId
          )

          assert.isRejected(
            program.simulate.initDocument(
              newTitle,
              participants.map(p => p.publicKey),
              {
                accounts: {
                  authority: authority.publicKey,
                  payer: authority.publicKey,
                  clerk,
                  document: newDocKey,
                  systemProgram: web3.SystemProgram.programId
                },
                signers: [authority]
              }
            )
          )
        })
      })
    })

    describe('invoke `add_signature` for a participant to willingly sign a document', () => {
      describe('but the instruction will fail when', () => {
        it('the participant is not associated with the document', () => {
          const random = web3.Keypair.generate()
          assert.isRejected(
            program.simulate.addSignature({
              accounts: {
                participant: random.publicKey,
                document
              },
              signers: [random]
            })
          )
        })
      })

      describe('and when the instruction succeeds for a single participant', () => {
        let docData: any

        before(async () => {
          await program.rpc.addSignature({
            accounts: {
              participant: participants[2].publicKey,
              document
            },
            signers: [participants[2]]
          })

          docData = await program.account.document.fetch(document)
        })

        it('their signature timestamp is added to the document account data', () => {
          assert.notEqual(docData.timestamps[2].toNumber(), 0)
        })

        it('the same participant can not submit subsequent signatures on the same document', () => {
          assert.isRejected(
            program.simulate.addSignature({
              accounts: {
                participant: participants[2].publicKey,
                document
              },
              signers: [participants[2]]
            })
          )
        })
      })
    })

    describe('the creator can invoke `finalize` to complete a document and mint the NFT', () => {
      before(async () => {
        ;[mint] = await web3.PublicKey.findProgramAddress(
          [Buffer.from('mint'), document.toBytes()],
          program.programId
        )

        nftTokenAccount = await Token.getAssociatedTokenAddress(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          mint,
          authority.publicKey
        )
      })

      describe('it will fail when', () => {
        it('not all participants have signature timestamps on the document', () => {
          assert.isRejected(
            program.simulate.finalize({
              accounts: {
                authority: authority.publicKey,
                payer: authority.publicKey,
                clerk,
                document,
                mint,
                nftTokenAccount,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                rent: web3.SYSVAR_RENT_PUBKEY
              },
              signers: [authority]
            })
          )
        })

        after(async () => {
          await Promise.all(
            [participants[0], participants[1], participants[3]].map(p =>
              program.rpc.addSignature({
                accounts: {
                  participant: p.publicKey,
                  document
                },
                signers: [p]
              })
            )
          )
        })
      })

      describe('but once the document is successfully finalized by the creator', () => {
        let docData: any

        before(async () => {
          await program.rpc.finalize({
            accounts: {
              authority: authority.publicKey,
              payer: authority.publicKey,
              clerk,
              document,
              mint,
              nftTokenAccount,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: web3.SystemProgram.programId,
              rent: web3.SYSVAR_RENT_PUBKEY
            },
            signers: [authority]
          })

          docData = await program.account.document.fetch(document)
        })

        it('the mint and NFT token account public keys are set in the account data', () => {
          assert.isTrue(docData.mint.equals(mint))
          assert.isTrue(docData.nft.equals(nftTokenAccount))
        })

        it('it will have a non-zero finalization timestamp in account data', () => {
          assert.notEqual(docData.finalizationTimestamp.toNumber(), 0)
        })

        it('the document creator will have an NFT token account for the document mint', async () => {
          const accs = await program.provider.connection.getTokenAccountsByOwner(
            authority.publicKey,
            {
              mint
            }
          )

          assert.lengthOf(accs.value, 1)
          assert.isTrue(accs.value[0].pubkey.equals(nftTokenAccount))

          const balance = await program.provider.connection.getTokenAccountBalance(nftTokenAccount)
          assert.equal(balance.value.amount, '1')
        })

        it('the document mint will no longer have a mint authority', async () => {
          const info = await program.provider.connection.getAccountInfo(mint)
          const m = MintLayout.decode(info.data)
          assert.equal(m.mintAuthorityOption, 0)
        })
      })
    })
  })
})
