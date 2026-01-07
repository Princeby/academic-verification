// src/lib/blockchain/transactions.ts
import type { ApiPromise } from '@polkadot/api';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { web3FromAddress } from '@polkadot/extension-dapp';

export interface TransactionStatus {
  status: 'idle' | 'signing' | 'submitting' | 'inBlock' | 'finalized' | 'error';
  message: string;
  blockHash?: string;
  error?: string;
}

export interface TransactionResult {
  success: boolean;
  blockHash?: string;
  transactionHash?: string;
  error?: string;
}

interface SubmittableResult {
  status: {
    isReady: boolean;
    isInBlock: boolean;
    isFinalized: boolean;
    asInBlock: { toHex(): string };
    asFinalized: { toHex(): string };
  };
  dispatchError?: {
    isModule: boolean;
    asModule: unknown;
    toString(): string;
  };
}

/**
 * Submit a transaction with proper error handling and status updates
 */
export function submitTransaction(
  api: ApiPromise,
  account: InjectedAccountWithMeta | { address: string },
  extrinsic: { signAndSend: Function; hash: { toHex(): string } },
  onStatusUpdate?: (status: TransactionStatus) => void
): Promise<TransactionResult> {
  return new Promise(async (resolve) => {
    try {
      onStatusUpdate?.({
        status: 'signing',
        message: 'Waiting for signature...',
      });

      const injector = await web3FromAddress(account.address);

      let unsub: (() => void) | undefined;

      unsub = await extrinsic.signAndSend(
        account.address,
        { signer: injector.signer },
        (result: SubmittableResult) => {
          const { status, dispatchError } = result;
          if (status.isReady) {
            onStatusUpdate?.({
              status: 'signing',
              message: 'Waiting for signature...',
            });
          }

          if (status.isInBlock) {
            onStatusUpdate?.({
              status: 'inBlock',
              message: 'Transaction included in block',
              blockHash: status.asInBlock.toHex(),
            });
          }

          if (dispatchError) {
            let errorMessage = dispatchError.toString();

            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(
                dispatchError.asModule as Parameters<typeof api.registry.findMetaError>[0]
              );
              errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
            }

            onStatusUpdate?.({
              status: 'error',
              message: 'Transaction failed',
              error: errorMessage,
            });

            unsub?.();
            resolve({ success: false, error: errorMessage });
            return;
          }

          if (status.isFinalized) {
            onStatusUpdate?.({
              status: 'finalized',
              message: 'Transaction finalized',
              blockHash: status.asFinalized.toHex(),
            });

            unsub?.();
            resolve({
              success: true,
              blockHash: status.asFinalized.toHex(),
              transactionHash: extrinsic.hash.toHex(),
            });
          }
        }
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';

      onStatusUpdate?.({
        status: 'error',
        message: 'Transaction failed',
        error: message,
      });

      resolve({ success: false, error: message });
    }
  });
}

/**
 * DID Pallet Transactions
 */
export class DIDTransactions {
  constructor(private api: ApiPromise) { }

  async createDID(
    account: InjectedAccountWithMeta | { address: string },
    publicKey: Uint8Array,
    keyType: 'Ed25519' | 'Sr25519' | 'ECDSA',
    onStatusUpdate?: (status: TransactionStatus) => void
  ): Promise<TransactionResult> {
    const tx = this.api.tx.did.createDid(publicKey, keyType);
    return submitTransaction(this.api, account, tx, onStatusUpdate);
  }

  async registerInstitution(
    account: InjectedAccountWithMeta | { address: string },
    name: string,
    onStatusUpdate?: (status: TransactionStatus) => void
  ): Promise<TransactionResult> {
    const tx = this.api.tx.did.registerInstitution(name);
    return submitTransaction(this.api, account, tx, onStatusUpdate);
  }

  async addPublicKey(
    account: InjectedAccountWithMeta | { address: string },
    publicKey: Uint8Array,
    keyType: 'Ed25519' | 'Sr25519' | 'ECDSA',
    onStatusUpdate?: (status: TransactionStatus) => void
  ): Promise<TransactionResult> {
    const tx = this.api.tx.did.addPublicKey(publicKey, keyType);
    return submitTransaction(this.api, account, tx, onStatusUpdate);
  }
}

/**
 * Credential Pallet Transactions
 */
export class CredentialTransactions {
  constructor(private api: ApiPromise) { }

  async issueCredential(
    account: InjectedAccountWithMeta | { address: string },
    holder: string,
    credentialHash: string,
    credentialType: string,
    metadata: string,
    expiresAt: number | null,
    onStatusUpdate?: (status: TransactionStatus) => void
  ): Promise<TransactionResult> {
    // Map UI credential types to blockchain enum variants
    const typeMapping: Record<string, string> = {
      "Bachelor's Degree": "Degree",
      "Master's Degree": "MastersDegree",
      "Doctorate (PhD)": "Doctorate",
      "Certificate": "Certificate",
      "Transcript": "Transcript",
      "Professional Certification": "ProfessionalCertification",
      "Other": "Other",
    };

    const blockchainType = typeMapping[credentialType] || "Other";

    console.log('📋 Mapping credential type:', credentialType, '->', blockchainType);

    const tx = this.api.tx.credential.issueCredential(
      holder,
      credentialHash,
      blockchainType, // Use mapped type
      metadata,
      expiresAt
    );

    return submitTransaction(this.api, account, tx, onStatusUpdate);
  }

  async revokeCredential(
    account: InjectedAccountWithMeta | { address: string },
    credentialId: string,
    onStatusUpdate?: (status: TransactionStatus) => void
  ): Promise<TransactionResult> {
    const tx = this.api.tx.credential.revokeCredential(credentialId);
    return submitTransaction(this.api, account, tx, onStatusUpdate);
  }

  async verifyCredential(
    account: InjectedAccountWithMeta | { address: string },
    credentialHash: string,
    onStatusUpdate?: (status: TransactionStatus) => void
  ): Promise<TransactionResult> {
    const tx = this.api.tx.credential.verifyCredential(credentialHash);
    return submitTransaction(this.api, account, tx, onStatusUpdate);
  }
}

/**
 * Reputation Pallet Transactions
 */
export class ReputationTransactions {
  constructor(private api: ApiPromise) { }

  async endorse(
    account: InjectedAccountWithMeta | { address: string },
    endorsee: string,
    endorsementType: string,
    comment: string,
    weight: number,
    onStatusUpdate?: (status: TransactionStatus) => void
  ): Promise<TransactionResult> {
    const tx = this.api.tx.reputation.endorse(
      endorsee,
      endorsementType,
      comment,
      weight
    );
    return submitTransaction(this.api, account, tx, onStatusUpdate);
  }
}