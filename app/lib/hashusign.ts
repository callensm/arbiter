export type Hashusign = {
  version: '0.1.0'
  name: 'hashusign'
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
          name: 'mint'
          isMut: true
          isSigner: false
        },
        {
          name: 'nftTokenAccount'
          isMut: true
          isSigner: false
        },
        {
          name: 'associatedTokenProgram'
          isMut: false
          isSigner: false
        },
        {
          name: 'tokenProgram'
          isMut: false
          isSigner: false
        },
        {
          name: 'systemProgram'
          isMut: false
          isSigner: false
        },
        {
          name: 'rent'
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
            name: 'mint'
            type: 'publicKey'
          },
          {
            name: 'nft'
            type: 'publicKey'
          },
          {
            name: 'title'
            type: 'string'
          },
          {
            name: 'participants'
            type: {
              vec: 'publicKey'
            }
          },
          {
            name: 'timestamps'
            type: {
              vec: 'u64'
            }
          },
          {
            name: 'finalizationTimestamp'
            type: 'u64'
          },
          {
            name: 'mintBump'
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
    }
  ]
  types: [
    {
      name: 'ErrorCode'
      type: {
        kind: 'enum'
        variants: [
          {
            name: 'ClerkDocumentListIsFull'
          },
          {
            name: 'ClerkDoesNotHoldDocument'
          },
          {
            name: 'ClerkLimitIsZero'
          },
          {
            name: 'ClerkUpgradeAmountIsZero'
          },
          {
            name: 'ClerkUpgradingWithRemainingSpace'
          },
          {
            name: 'DocumentIsAlreadyFinalized'
          },
          {
            name: 'DocumentIsMissingSignatures'
          },
          {
            name: 'EmptyDocumentParticipants'
          },
          {
            name: 'EmptyDocumentTitle'
          },
          {
            name: 'MintAuthorityMisMatch'
          },
          {
            name: 'MintDecimalNotZero'
          },
          {
            name: 'ParticipantAlreadySigned'
          },
          {
            name: 'ParticipantsAreNotUnique'
          },
          {
            name: 'ParticipantNotAssociated'
          }
        ]
      }
    }
  ]
}

export const IDL: Hashusign = {
  version: '0.1.0',
  name: 'hashusign',
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
          name: 'mint',
          isMut: true,
          isSigner: false
        },
        {
          name: 'nftTokenAccount',
          isMut: true,
          isSigner: false
        },
        {
          name: 'associatedTokenProgram',
          isMut: false,
          isSigner: false
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false
        },
        {
          name: 'rent',
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
            name: 'mint',
            type: 'publicKey'
          },
          {
            name: 'nft',
            type: 'publicKey'
          },
          {
            name: 'title',
            type: 'string'
          },
          {
            name: 'participants',
            type: {
              vec: 'publicKey'
            }
          },
          {
            name: 'timestamps',
            type: {
              vec: 'u64'
            }
          },
          {
            name: 'finalizationTimestamp',
            type: 'u64'
          },
          {
            name: 'mintBump',
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
    }
  ],
  types: [
    {
      name: 'ErrorCode',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'ClerkDocumentListIsFull'
          },
          {
            name: 'ClerkDoesNotHoldDocument'
          },
          {
            name: 'ClerkLimitIsZero'
          },
          {
            name: 'ClerkUpgradeAmountIsZero'
          },
          {
            name: 'ClerkUpgradingWithRemainingSpace'
          },
          {
            name: 'DocumentIsAlreadyFinalized'
          },
          {
            name: 'DocumentIsMissingSignatures'
          },
          {
            name: 'EmptyDocumentParticipants'
          },
          {
            name: 'EmptyDocumentTitle'
          },
          {
            name: 'MintAuthorityMisMatch'
          },
          {
            name: 'MintDecimalNotZero'
          },
          {
            name: 'ParticipantAlreadySigned'
          },
          {
            name: 'ParticipantsAreNotUnique'
          },
          {
            name: 'ParticipantNotAssociated'
          }
        ]
      }
    }
  ]
}
