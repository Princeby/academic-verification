// src/lib/blockchain/transactions.ts
import type { ApiPromise } from '@polkadot/api';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { toast } from 'sonner';

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

/**
 * Submit a transaction with proper error handling and status updates
 */
export async function submitTransaction(
  api: ApiPromise,
  account: InjectedAccountWithMeta | { address: string },
  extrinsic: any,
  onStatusUpdate?: (status: TransactionStatus) => void
): Promise<TransactionResult> {
  try {
    // Get the injector for signing
    onStatusUpdate?.({
      status: 'signing',
      message: 'Waiting for signature...',
    });

    const injector = await web3FromAddress(account.address);

    let blockHash: string | undefined;
    let txHash: string | undefined;

    // Submit the transaction
    onStatusUpdate?.({
      status: 'submitting',
      message: 'Submitting transaction...',
    });

    const unsub = await extrinsic.signAndSend(
      account.address,
      { signer: injector.signer },
      ({ status, events, dispatchError }: any) => {
        if (status.isInBlock) {
          blockHash = status.asInBlock.toHex();
          txHash = extrinsic.hash.toHex();
          
          onStatusUpdate?.({
            status: 'inBlock',
            message: 'Transaction included in block',
            blockHash,
          });
        }

        if (status.isFinalized) {
          // Check for errors in events
          let hasError = false;
          let errorMessage = '';

          events.forEach(({ event }: any) => {
            if (api.events.system.ExtrinsicFailed.is(event)) {
              hasError = true;
              const [dispatchError] = event.data;
              
              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
              } else {
                errorMessage = dispatchError.toString();
              }
            }
          });

          if (hasError) {
            onStatusUpdate?.({
              status: 'error',
              message: 'Transaction failed',
              error: errorMessage,
            });
            unsub();
            return;
          }

          onStatusUpdate?.({
            status: 'finalized',
            message: 'Transaction finalized',
            blockHash: status.asFinalized.toHex(),
          });

          unsub();
        }
      }
    );

    // Wait for finalization
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Transaction timeout'));
      }, 60000); // 60 second timeout

      const checkStatus = setInterval(() => {
        if (blockHash) {
          clearTimeout(timeout);
          clearInterval(checkStatus);
          resolve(true);
        }
      }, 100);
    });

    return {
      success: true,
      blockHash,
      transactionHash: txHash,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    onStatusUpdate?.({
      status: 'error',
      message: 'Transaction failed',
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * DID Pallet Transactions
 */
export class DIDTransactions {
  constructor(private api: ApiPromise) {}

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
  constructor(private api: ApiPromise) {}

  async issueCredential(
    account: InjectedAccountWithMeta | { address: string },
    holder: string,
    credentialHash: string,
    credentialType: string,
    metadata: string,
    expiresAt: number | null,
    onStatusUpdate?: (status: TransactionStatus) => void
  ): Promise<TransactionResult> {
    const tx = this.api.tx.credential.issueCredential(
      holder,
      credentialHash,
      credentialType,
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
  constructor(private api: ApiPromise) {}

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