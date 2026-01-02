// src/lib/blockchain/integration.ts
import type { ApiPromise } from '@polkadot/api';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { blake2AsHex } from '@polkadot/util-crypto';

/**
 * Generate Blake2 hash from file
 */
export async function generateFileHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        const hash = blake2AsHex(uint8Array, 256);
        resolve(hash);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Verify file matches hash
 */
export async function verifyFileHash(file: File, expectedHash: string): Promise<boolean> {
  try {
    const actualHash = await generateFileHash(file);
    return actualHash === expectedHash;
  } catch (error) {
    console.error('Error verifying file hash:', error);
    return false;
  }
}

/**
 * Format blockchain data for UI
 */
export function formatCredentialData(rawCredential: any) {
  return {
    id: rawCredential.credentialId,
    holder: rawCredential.holder,
    issuer: rawCredential.issuer,
    credentialHash: rawCredential.credentialHash,
    credentialType: formatCredentialType(rawCredential.credentialType),
    metadata: rawCredential.metadata ? Buffer.from(rawCredential.metadata).toString('utf-8') : undefined,
    issuedAt: rawCredential.issuedAt,
    expiresAt: rawCredential.expiresAt || undefined,
    revoked: rawCredential.status === 'Revoked',
  };
}

/**
 * Format credential type enum
 */
function formatCredentialType(type: any): string {
  if (typeof type === 'string') return type;
  
  const typeMap: Record<string, string> = {
    'Degree': "Bachelor's Degree",
    'MastersDegree': "Master's Degree",
    'Doctorate': 'Doctorate (PhD)',
    'Certificate': 'Certificate',
    'Transcript': 'Transcript',
    'ProfessionalCertification': 'Professional Certification',
    'Other': 'Other',
  };
  
  if (typeof type === 'object') {
    const key = Object.keys(type)[0];
    return typeMap[key] || 'Unknown';
  }
  
  return typeMap[type] || type;
}

/**
 * Parse metadata string to object
 */
export function parseMetadata(metadata?: string): Record<string, any> {
  if (!metadata) return {};
  
  try {
    return JSON.parse(metadata);
  } catch {
    // If not JSON, return as simple object with text field
    return { text: metadata };
  }
}

/**
 * Encode metadata for blockchain
 */
export function encodeMetadata(data: Record<string, any>): string {
  return JSON.stringify(data);
}

/**
 * Check if API is connected and has pallet
 */
export async function checkPalletAvailability(api: ApiPromise, palletName: string): Promise<boolean> {
  try {
    // @ts-ignore - Dynamic pallet access
    return api.query[palletName] !== undefined;
  } catch {
    return false;
  }
}

/**
 * Wait for transaction to be included in block
 */
export async function waitForInBlock(
  api: ApiPromise,
  txHash: string,
  timeout = 30000
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Transaction timeout'));
    }, timeout);

    const checkTransaction = async () => {
      try {
        const block = await api.rpc.chain.getBlock();
        const extrinsics = block.block.extrinsics;
        
        for (const ext of extrinsics) {
          if (ext.hash.toHex() === txHash) {
            clearTimeout(timeoutId);
            resolve(true);
            return;
          }
        }
        
        setTimeout(checkTransaction, 1000);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    };

    checkTransaction();
  });
}

/**
 * Get human-readable error from dispatch error
 */
export function getErrorMessage(api: ApiPromise, dispatchError: any): string {
  if (dispatchError.isModule) {
    try {
      const decoded = api.registry.findMetaError(dispatchError.asModule);
      return `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
    } catch (error) {
      return 'Unknown module error';
    }
  }
  
  return dispatchError.toString();
}

/**
 * Check if account has sufficient balance for transaction
 */
export async function checkSufficientBalance(
  api: ApiPromise,
  address: string,
  requiredAmount: bigint = BigInt(0)
): Promise<{ sufficient: boolean; balance: string }> {
  try {
    const { data: { free } } = await api.query.system.account(address);
    const freeBalance = BigInt(free.toString());
    
    return {
      sufficient: freeBalance > requiredAmount,
      balance: free.toString(),
    };
  } catch (error) {
    console.error('Error checking balance:', error);
    return { sufficient: false, balance: '0' };
  }
}

/**
 * Estimate transaction fee
 */
export async function estimateTransactionFee(
  api: ApiPromise,
  extrinsic: any,
  address: string
): Promise<string> {
  try {
    const paymentInfo = await extrinsic.paymentInfo(address);
    return paymentInfo.partialFee.toString();
  } catch (error) {
    console.error('Error estimating fee:', error);
    return '0';
  }
}

/**
 * Parse account from string or return as-is
 */
export function parseAccount(account: string | { address: string }): string {
  return typeof account === 'string' ? account : account.address;
}

/**
 * Store file reference (without IPFS for now, just returns hash)
 */
export async function storeFileReference(file: File): Promise<string> {
  // For now, just generate and return the hash
  // In future, integrate with IPFS or other storage
  const hash = await generateFileHash(file);
  
  // Store file metadata in localStorage for demo purposes
  const metadata = {
    name: file.name,
    size: file.size,
    type: file.type,
    hash,
    storedAt: Date.now(),
  };
  
  const stored = JSON.parse(localStorage.getItem('file_references') || '{}');
  stored[hash] = metadata;
  localStorage.setItem('file_references', JSON.stringify(stored));
  
  return hash;
}

/**
 * Get file reference metadata
 */
export function getFileReference(hash: string): any | null {
  try {
    const stored = JSON.parse(localStorage.getItem('file_references') || '{}');
    return stored[hash] || null;
  } catch {
    return null;
  }
}

/**
 * Batch query multiple items
 */
export async function batchQuery<T>(
  api: ApiPromise,
  queries: Array<Promise<T>>
): Promise<T[]> {
  try {
    return await Promise.all(queries);
  } catch (error) {
    console.error('Batch query error:', error);
    return [];
  }
}

/**
 * Subscribe to events for a specific pallet
 */
export function subscribeToEvents(
  api: ApiPromise,
  palletName: string,
  eventName: string,
  callback: (event: any) => void
): () => void {
  const unsubscribe = api.query.system.events((events: any) => {
    events.forEach((record: any) => {
      const { event } = record;
      
      if (event.section === palletName && event.method === eventName) {
        callback(event);
      }
    });
  });
  
  return () => unsubscribe.then(unsub => unsub());
}