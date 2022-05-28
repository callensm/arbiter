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
  const additionalParticipant = web3.Keypair.generate()

  const title = 'My Test Document'
  const uri = 'https://arweave.net/abc123'

  let clerk: web3.PublicKey
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
                uri,
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

        it('the document uri is empty', async () => {
          assert.isRejected(
            program.methods
              .initDocument(
                title,
                '',
                participants.map(p => p.publicKey)
              )
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

        it('the participants public key array is empty', () => {
          assert.isRejected(
            program.methods
              .initDocument(title, uri, [])
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
              .initDocument(title, uri, [
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
              uri,
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

          it('correct title and uri', () => {
            assert.strictEqual(docData.account.title, title)
            assert.strictEqual(docData.account.uri, uri)
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
                uri,
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

    describe('the creator can add a new participant with `add_participant`', () => {
      describe('unless it fails because', () => {
        it('the participant is already listed on the document', () => {
          assert.isRejected(
            program.methods
              .addParticipant(participants[0].publicKey)
              .accounts({
                authority: authority.publicKey,
                payer: authority.publicKey,
                document
              })
              .signers([authority])
              .simulate()
          )
        })
      })

      describe('and when they are successfully added to the document', () => {
        let newDocument: any

        before(async () => {
          await program.methods
            .addParticipant(additionalParticipant.publicKey)
            .accounts({
              authority: authority.publicKey,
              payer: authority.publicKey,
              document
            })
            .signers([authority])
            .rpc()

          newDocument = await program.account.document.fetch(document)
        })

        it('their public key is appended to the list of participants', async () => {
          assert.lengthOf(newDocument.participants, 5)
          assert.isTrue(newDocument.participants[4].equals(additionalParticipant.publicKey))
        })

        it('and empty signature timestamp is appended for them', () => {
          assert.lengthOf(newDocument.signatureTimestamps, 5)
          assert.isTrue(newDocument.signatureTimestamps[4].eq(new BN(0)))
        })
      })
    })

    describe('the creator can invoke `finalize` to complete a document', () => {
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
            [participants[0], participants[1], participants[3], additionalParticipant].map(p =>
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

        it('new participants cannot be added', () => {
          const newPart = web3.Keypair.generate()
          assert.isRejected(
            program.methods
              .addParticipant(newPart.publicKey)
              .accounts({ authority: authority.publicKey, payer: authority.publicKey, document })
              .signers([authority])
              .simulate()
          )
        })
      })
    })

    describe('use the `upgrade` instruction to increase the document storage limit', () => {
      describe('except when it failed because', () => {
        it('the increase limit requested was less than 1', () => {
          assert.isRejected(
            program.methods
              .upgrade(0)
              .accounts({ authority: authority.publicKey, clerk })
              .signers([authority])
              .simulate()
          )
        })
      })

      describe('but when the storage upgrade is successful', () => {
        let oldClerkData: Buffer
        let newClerkData: Buffer

        before(async () => {
          const info = await program.provider.connection.getAccountInfo(clerk)
          oldClerkData = info.data

          await program.methods
            .upgrade(2)
            .accounts({
              authority: authority.publicKey,
              clerk
            })
            .signers([authority])
            .rpc()
        })

        it('the clerk account data reallocs only for the `amt * 32` for new public keys', async () => {
          const info = await program.provider.connection.getAccountInfo(clerk)
          newClerkData = info.data
          assert.strictEqual(info.data.length - oldClerkData.length, 32 * 2)
        })

        it('the clerk contains the correct amount of newly zeroed public keys in documents vector', () => {
          const c = program.coder.accounts.decode('Clerk', newClerkData)
          assert.lengthOf(c.documents, 3)
          assert.strictEqual(
            c.documents.filter((d: web3.PublicKey) => d.equals(web3.PublicKey.default)).length,
            2
          )
        })

        it('the upgrade count is incremented to track the number of upgrades', () => {
          const c = program.coder.accounts.decode('Clerk', newClerkData)
          assert.strictEqual(c.upgrades, 1)
        })
      })
    })
  })
})
