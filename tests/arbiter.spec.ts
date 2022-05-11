import {
  BN,
  Program,
  ProgramAccount,
  AnchorProvider as Provider,
  setProvider,
  web3,
  workspace
} from '@project-serum/anchor'
import { assert, use as chaiUse } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Arbiter } from '../target/types/arbiter'

chaiUse(chaiAsPromised)

describe('arbiter', async () => {
  setProvider(Provider.env())

  const program = workspace.Arbiter as Program<Arbiter>

  const authority = ((program.provider as Provider).wallet as any).payer as web3.Keypair
  const participants = [...Array(4)].map(() => web3.Keypair.generate())

  const title = 'My Test Document'
  let clerk: web3.PublicKey
  let stagedClerk: web3.PublicKey
  let document: web3.PublicKey

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
            program.methods
              .initClerk(0)
              .accounts({
                authority: authority.publicKey,
                payer: authority.publicKey,
                clerk
              })
              .signers([authority])
              .simulate()
          )
        })
      })

      describe('but when the clerk is successfully created', () => {
        let clerkData: ProgramAccount<any>

        before(async () => {
          await program.methods
            .initClerk(1)
            .accounts({
              authority: authority.publicKey,
              payer: authority.publicKey,
              clerk
            })
            .signers([authority])
            .rpc()
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
          [
            Buffer.from('document'),
            authority.publicKey.toBytes(),
            Buffer.from(title.substring(0, 32))
          ],
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
            program.methods
              .initDocument(
                '',
                participants.map(p => p.publicKey)
              )
              .accounts({
                authority: authority.publicKey,
                payer: authority.publicKey,
                clerk,
                document: badDoc
              })
              .signers([authority])
              .simulate()
          )
        })

        it('the participants public key array is empty', () => {
          assert.isRejected(
            program.methods
              .initDocument(title, [])
              .accounts({
                authority: authority.publicKey,
                payer: authority.publicKey,
                clerk,
                document
              })
              .signers([authority])
              .simulate()
          )
        })

        it('there are duplicate participant public keys', () => {
          assert.isRejected(
            program.methods
              .initDocument(title, [
                ...participants.map(p => p.publicKey),
                participants[0].publicKey
              ])
              .accounts({
                authority: authority.publicKey,
                payer: authority.publicKey,
                clerk,
                document
              })
              .signers([authority])
              .simulate()
          )
        })
      })

      describe('but when the instruction is successful', () => {
        let docData: ProgramAccount<any>

        before(async () => {
          await program.methods
            .initDocument(
              title,
              participants.map(p => p.publicKey)
            )
            .accounts({
              authority: authority.publicKey,
              payer: authority.publicKey,
              clerk,
              document
            })
            .signers([authority])
            .rpc()
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
          })

          it('participants and timestamp defaults', () => {
            assert.lengthOf(docData.account.participants, 4)
            assert.deepEqual(
              docData.account.participants.map((p: web3.PublicKey) => p.toBase58()),
              participants.map(p => p.publicKey.toBase58())
            )

            assert.lengthOf(docData.account.signatureTimestamps, 4)
            assert.equal(
              docData.account.signatureTimestamps.reduce(
                (acc: number, curr: BN) => acc + curr.toNumber(),
                0
              ),
              0
            )
          })

          it('additional state data fields', () => {
            assert.equal(docData.account.finalizationTimestamp.toNumber(), 0)
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
            program.methods
              .initDocument(
                newTitle,
                participants.map(p => p.publicKey)
              )
              .accounts({
                authority: authority.publicKey,
                payer: authority.publicKey,
                clerk,
                document: newDocKey
              })
              .signers([authority])
              .simulate()
          )
        })
      })
    })

    describe('invoke `add_signature` for a participant to willingly sign a document', () => {
      describe('but the instruction will fail when', () => {
        it('the participant is not associated with the document', () => {
          const random = web3.Keypair.generate()
          assert.isRejected(
            program.methods
              .addSignature()
              .accounts({
                participant: random.publicKey,
                document
              })
              .signers([random])
              .simulate()
          )
        })
      })

      describe('and when the instruction succeeds for a single participant', () => {
        let docData: any

        before(async () => {
          await program.methods
            .addSignature()
            .accounts({
              participant: participants[2].publicKey,
              document
            })
            .signers([participants[2]])
            .rpc()

          docData = await program.account.document.fetch(document)
        })

        it('their signature timestamp is added to the document account data', () => {
          assert.notEqual(docData.signatureTimestamps[2].toNumber(), 0)
        })

        it('the same participant can not submit subsequent signatures on the same document', () => {
          assert.isRejected(
            program.methods
              .addSignature()
              .accounts({
                participant: participants[2].publicKey,
                document
              })
              .signers([participants[2]])
              .simulate()
          )
        })
      })
    })

    describe('the creator can invoke `finalize` to complete a document and mint the NFT', () => {
      describe('it will fail when', () => {
        it('not all participants have signature timestamps on the document', () => {
          assert.isRejected(
            program.methods
              .finalize()
              .accounts({
                authority: authority.publicKey,
                payer: authority.publicKey,
                clerk,
                document
              })
              .signers([authority])
              .simulate()
          )
        })

        after(async () => {
          await Promise.all(
            [participants[0], participants[1], participants[3]].map(p =>
              program.methods
                .addSignature()
                .accounts({
                  participant: p.publicKey,
                  document
                })
                .signers([p])
                .rpc()
            )
          )
        })
      })

      describe('but once the document is successfully finalized by the creator', () => {
        let docData: any

        before(async () => {
          await program.methods
            .finalize()
            .accounts({
              authority: authority.publicKey,
              payer: authority.publicKey,
              clerk,
              document
            })
            .signers([authority])
            .rpc()

          docData = await program.account.document.fetch(document)
        })

        it('it will have a non-zero finalization timestamp in account data', () => {
          assert.notEqual(docData.finalizationTimestamp.toNumber(), 0)
        })
      })
    })

    describe('increase the document storage limit for their clerk by', () => {
      let oldClerkData: any

      describe('using `stage_upgrade` to prepare their clerk data for migration', () => {
        before(async () => {
          oldClerkData = await program.account.clerk.fetch(clerk)
          ;[stagedClerk] = await web3.PublicKey.findProgramAddress(
            [Buffer.from('clerk'), Buffer.from('staged'), authority.publicKey.toBytes()],
            program.programId
          )

          await program.methods
            .stageUpgrade()
            .accounts({
              authority: authority.publicKey,
              payer: authority.publicKey,
              receiver: authority.publicKey,
              oldClerk: clerk,
              stagedClerk
            })
            .signers([authority])
            .rpc()
        })

        describe('which will', () => {
          it('close the original clerk program account', async () => {
            const c = await program.account.clerk.fetchNullable(clerk)
            assert.isNull(c)
          })

          it('create a new staged seeded clerk account with migrated data', async () => {
            const c = await program.account.clerk.fetchNullable(stagedClerk)
            assert.isNotNull(c)
            assert.isTrue(c.authority.equals(oldClerkData.authority))
            assert.deepEqual(oldClerkData.documents, c.documents)
            assert.equal(oldClerkData.documents.length, c.documents.length)
          })
        })
      })

      describe('and then invoking `upgrade_limit` in order to', () => {
        let newClerkData: any

        before(async () => {
          await program.methods
            .upgradeLimit(2)
            .accounts({
              authority: authority.publicKey,
              payer: authority.publicKey,
              receiver: authority.publicKey,
              stagedClerk,
              newClerk: clerk
            })
            .signers([authority])
            .rpc()
        })

        it('reinitialize their clerk account', async () => {
          newClerkData = await program.account.clerk.fetch(clerk)
          assert.isTrue(newClerkData.authority.equals(authority.publicKey))
          assert.isTrue(newClerkData.authority.equals(oldClerkData.authority))
          assert.deepEqual(newClerkData.bump, oldClerkData.bump)
        })

        it('copy over their original set of document public keys', () => {
          assert.deepEqual(
            oldClerkData.documents,
            newClerkData.documents.slice(0, oldClerkData.documents.length)
          )
        })

        it('increase the number of documents their migrated account can hold', () => {
          assert.notEqual(oldClerkData.documents.length, newClerkData.documents.length)
          assert.lengthOf(newClerkData.documents, 3)
        })

        it('increments the number of clerk upgrades for the account', () => {
          assert.equal(newClerkData.upgrades, oldClerkData.upgrades + 1)
        })
      })
    })
  })
})
