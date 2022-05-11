export type Arbiter = {
  version: '0.1.0'
  name: 'arbiter'
  constants: [
    {
      name: 'CLERK'
      type: {
        defined: '&[u8]'
      }
      value: 'b"clerk"'
    },
    {
      name: 'DOCUMENT'
      type: {
        defined: '&[u8]'
      }
      value: 'b"document"'
    },
    {
      name: 'MINT'
      type: {
        defined: '&[u8]'
      }
      value: 'b"mint"'
    },
    {
      name: 'STAGED'
      type: {
        defined: '&[u8]'
      }
      value: 'b"staged"'
    }
  ]
  instructions: [
    {
      name: 'addSignature'
      accounts: [
        {
          name: 'participant'
          isMut: false
          isSigner: true
        },
        {
          name: 'document'
          isMut: true
          isSigner: false
        }
      ]
      args: []
    },
    {
      name: 'finalize'
      accounts: [
        {
          name: 'authority'
          isMut: false
          isSigner: true
        },
        {
          name: 'payer'
          isMut: true
          isSigner: false
        },
        {
          name: 'clerk'
          isMut: false
          isSigner: false
        },
        {
          name: 'document'
          isMut: true
          isSigner: false
        },
        {
          name: 'systemProgram'
          isMut: false
          isSigner: false
        }
      ]
      args: []
    },
    {
      name: 'initClerk'
      accounts: [
        {
          name: 'authority'
          isMut: false
          isSigner: true
        },
        {
          name: 'payer'
          isMut: true
          isSigner: false
        },
        {
          name: 'clerk'
          isMut: true
          isSigner: false
        },
        {
          name: 'systemProgram'
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: 'limit'
          type: 'u8'
        }
      ]
    },
    {
      name: 'initDocument'
      accounts: [
        {
          name: 'authority'
          isMut: false
          isSigner: true
        },
        {
          name: 'payer'
          isMut: true
          isSigner: false
        },
        {
          name: 'clerk'
          isMut: true
          isSigner: false
        },
        {
          name: 'document'
          isMut: true
          isSigner: false
        },
        {
          name: 'systemProgram'
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: 'title'
          type: 'string'
        },
        {
          name: 'participants'
          type: {
            vec: 'publicKey'
          }
        }
      ]
    },
    {
      name: 'stageUpgrade'
      accounts: [
        {
          name: 'authority'
          isMut: false
          isSigner: true
        },
        {
          name: 'payer'
          isMut: true
          isSigner: false
        },
        {
          name: 'receiver'
          isMut: true
          isSigner: false
        },
        {
          name: 'oldClerk'
          isMut: true
          isSigner: false
        },
        {
          name: 'stagedClerk'
          isMut: true
          isSigner: false
        },
        {
          name: 'systemProgram'
          isMut: false
          isSigner: false
        }
      ]
      args: []
    },
    {
      name: 'upgradeLimit'
      accounts: [
        {
          name: 'authority'
          isMut: false
          isSigner: true
        },
        {
          name: 'payer'
          isMut: true
          isSigner: false
        },
        {
          name: 'receiver'
          isMut: true
          isSigner: false
        },
        {
          name: 'stagedClerk'
          isMut: true
          isSigner: false
        },
        {
          name: 'newClerk'
          isMut: true
          isSigner: false
        },
        {
          name: 'systemProgram'
          isMut: false
          isSigner: false
        }
      ]
      args: [
        {
          name: 'increaseAmount'
          type: 'u8'
        }
      ]
    }
  ]
  accounts: [
    {
      name: 'clerk'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'authority'
            type: 'publicKey'
          },
          {
            name: 'documents'
            type: {
              vec: 'publicKey'
            }
          },
          {
            name: 'upgrades'
            type: 'u8'
          },
          {
            name: 'bump'
            type: {
              array: ['u8', 1]
            }
          }
        ]
      }
    },
    {
      name: 'document'
      type: {
        kind: 'struct'
        fields: [
          {
            name: 'authority'
            type: 'publicKey'
          },
          {
            name: 'title'
            type: 'string'
          },
          {
            name: 'createdAt'
            type: 'u64'
          },
          {
            name: 'participants'
            type: {
              vec: 'publicKey'
            }
          },
          {
            name: 'signatureTimestamps'
            type: {
              vec: 'u64'
            }
          },
          {
            name: 'finalizationTimestamp'
            type: 'u64'
          },
          {
            name: 'bump'
            type: {
              array: ['u8', 1]
            }
          }
        ]
      }
    }
  ]
  events: [
    {
      name: 'SignatureAdded'
      fields: [
        {
          name: 'document'
          type: 'publicKey'
          index: false
        },
        {
          name: 'signer'
          type: 'publicKey'
          index: false
        }
      ]
    }
  ]
  errors: [
    {
      code: 6000
      name: 'ClerkDocumentListIsFull'
      msg: "The clerk account's list of documents has reached the current limit."
    },
    {
      code: 6001
      name: 'ClerkDoesNotHoldDocument'
      msg: 'The provided clerk program account does not hold custody of the given document public key.'
    },
    {
      code: 6002
      name: 'ClerkLimitIsZero'
      msg: 'The provided document limit for the clerk was less than or equal to zero.'
    },
    {
      code: 6003
      name: 'ClerkUpgradeAmountIsZero'
      msg: 'The provided amount to increase the clerk limit by was less than or equal to zero.'
    },
    {
      code: 6004
      name: 'ClerkUpgradingWithRemainingSpace'
      msg: 'The clerk account provided for upgrading has remaining document space.'
    },
    {
      code: 6005
      name: 'DocumentIsAlreadyFinalized'
      msg: 'The document submitted for updating has already been finalized with all required signatures.'
    },
    {
      code: 6006
      name: 'DocumentIsMissingSignatures'
      msg: 'The document does not have all participant signatuers.'
    },
    {
      code: 6007
      name: 'EmptyDocumentParticipants'
      msg: 'The participants list for the new document was empty.'
    },
    {
      code: 6008
      name: 'EmptyDocumentTitle'
      msg: 'The title provided for the new document was empty.'
    },
    {
      code: 6009
      name: 'MintAuthorityMisMatch'
      msg: 'The document token mint authority did not match the provided document.'
    },
    {
      code: 6010
      name: 'MintDecimalNotZero'
      msg: 'The provided document token mint has a non-zero decimal.'
    },
    {
      code: 6011
      name: 'ParticipantAlreadySigned'
      msg: 'The participant has already signed the provided document.'
    },
    {
      code: 6012
      name: 'ParticipantsAreNotUnique'
      msg: 'The list of participant public keys contain duplicates.'
    },
    {
      code: 6013
      name: 'ParticipantNotAssociated'
      msg: 'The participant public key is not associated with the document.'
    }
  ]
}

export const IDL: Arbiter = {
  version: '0.1.0',
  name: 'arbiter',
  constants: [
    {
      name: 'CLERK',
      type: {
        defined: '&[u8]'
      },
      value: 'b"clerk"'
    },
    {
      name: 'DOCUMENT',
      type: {
        defined: '&[u8]'
      },
      value: 'b"document"'
    },
    {
      name: 'MINT',
      type: {
        defined: '&[u8]'
      },
      value: 'b"mint"'
    },
    {
      name: 'STAGED',
      type: {
        defined: '&[u8]'
      },
      value: 'b"staged"'
    }
  ],
  instructions: [
    {
      name: 'addSignature',
      accounts: [
        {
          name: 'participant',
          isMut: false,
          isSigner: true
        },
        {
          name: 'document',
          isMut: true,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: 'finalize',
      accounts: [
        {
          name: 'authority',
          isMut: false,
          isSigner: true
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: false
        },
        {
          name: 'clerk',
          isMut: false,
          isSigner: false
        },
        {
          name: 'document',
          isMut: true,
          isSigner: false
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: 'initClerk',
      accounts: [
        {
          name: 'authority',
          isMut: false,
          isSigner: true
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: false
        },
        {
          name: 'clerk',
          isMut: true,
          isSigner: false
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: 'limit',
          type: 'u8'
        }
      ]
    },
    {
      name: 'initDocument',
      accounts: [
        {
          name: 'authority',
          isMut: false,
          isSigner: true
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: false
        },
        {
          name: 'clerk',
          isMut: true,
          isSigner: false
        },
        {
          name: 'document',
          isMut: true,
          isSigner: false
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: 'title',
          type: 'string'
        },
        {
          name: 'participants',
          type: {
            vec: 'publicKey'
          }
        }
      ]
    },
    {
      name: 'stageUpgrade',
      accounts: [
        {
          name: 'authority',
          isMut: false,
          isSigner: true
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: false
        },
        {
          name: 'receiver',
          isMut: true,
          isSigner: false
        },
        {
          name: 'oldClerk',
          isMut: true,
          isSigner: false
        },
        {
          name: 'stagedClerk',
          isMut: true,
          isSigner: false
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: 'upgradeLimit',
      accounts: [
        {
          name: 'authority',
          isMut: false,
          isSigner: true
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: false
        },
        {
          name: 'receiver',
          isMut: true,
          isSigner: false
        },
        {
          name: 'stagedClerk',
          isMut: true,
          isSigner: false
        },
        {
          name: 'newClerk',
          isMut: true,
          isSigner: false
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: 'increaseAmount',
          type: 'u8'
        }
      ]
    }
  ],
  accounts: [
    {
      name: 'clerk',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'authority',
            type: 'publicKey'
          },
          {
            name: 'documents',
            type: {
              vec: 'publicKey'
            }
          },
          {
            name: 'upgrades',
            type: 'u8'
          },
          {
            name: 'bump',
            type: {
              array: ['u8', 1]
            }
          }
        ]
      }
    },
    {
      name: 'document',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'authority',
            type: 'publicKey'
          },
          {
            name: 'title',
            type: 'string'
          },
          {
            name: 'createdAt',
            type: 'u64'
          },
          {
            name: 'participants',
            type: {
              vec: 'publicKey'
            }
          },
          {
            name: 'signatureTimestamps',
            type: {
              vec: 'u64'
            }
          },
          {
            name: 'finalizationTimestamp',
            type: 'u64'
          },
          {
            name: 'bump',
            type: {
              array: ['u8', 1]
            }
          }
        ]
      }
    }
  ],
  events: [
    {
      name: 'SignatureAdded',
      fields: [
        {
          name: 'document',
          type: 'publicKey',
          index: false
        },
        {
          name: 'signer',
          type: 'publicKey',
          index: false
        }
      ]
    }
  ],
  errors: [
    {
      code: 6000,
      name: 'ClerkDocumentListIsFull',
      msg: "The clerk account's list of documents has reached the current limit."
    },
    {
      code: 6001,
      name: 'ClerkDoesNotHoldDocument',
      msg: 'The provided clerk program account does not hold custody of the given document public key.'
    },
    {
      code: 6002,
      name: 'ClerkLimitIsZero',
      msg: 'The provided document limit for the clerk was less than or equal to zero.'
    },
    {
      code: 6003,
      name: 'ClerkUpgradeAmountIsZero',
      msg: 'The provided amount to increase the clerk limit by was less than or equal to zero.'
    },
    {
      code: 6004,
      name: 'ClerkUpgradingWithRemainingSpace',
      msg: 'The clerk account provided for upgrading has remaining document space.'
    },
    {
      code: 6005,
      name: 'DocumentIsAlreadyFinalized',
      msg: 'The document submitted for updating has already been finalized with all required signatures.'
    },
    {
      code: 6006,
      name: 'DocumentIsMissingSignatures',
      msg: 'The document does not have all participant signatuers.'
    },
    {
      code: 6007,
      name: 'EmptyDocumentParticipants',
      msg: 'The participants list for the new document was empty.'
    },
    {
      code: 6008,
      name: 'EmptyDocumentTitle',
      msg: 'The title provided for the new document was empty.'
    },
    {
      code: 6009,
      name: 'MintAuthorityMisMatch',
      msg: 'The document token mint authority did not match the provided document.'
    },
    {
      code: 6010,
      name: 'MintDecimalNotZero',
      msg: 'The provided document token mint has a non-zero decimal.'
    },
    {
      code: 6011,
      name: 'ParticipantAlreadySigned',
      msg: 'The participant has already signed the provided document.'
    },
    {
      code: 6012,
      name: 'ParticipantsAreNotUnique',
      msg: 'The list of participant public keys contain duplicates.'
    },
    {
      code: 6013,
      name: 'ParticipantNotAssociated',
      msg: 'The participant public key is not associated with the document.'
    }
  ]
}
