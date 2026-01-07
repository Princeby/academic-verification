// src/lib/blockchain/realQueries.ts
import type { ApiPromise } from '@polkadot/api';
import { formatCredentialData, checkPalletAvailability } from './integration';

/**
 * Enhanced DID Queries with real blockchain data
 */
export class RealDIDQueries {
  constructor(private api: ApiPromise) { }

  async getDID(address: string) {
    try {
      const hasPallet = await checkPalletAvailability(this.api, 'did');
      if (!hasPallet) {
        console.warn('DID pallet not available');
        return null;
      }

      const didDoc = await this.api.query.did.didDocuments(address);

      if (didDoc.isEmpty) {
        return null;
      }

      const data = didDoc.toJSON() as any;

      return {
        controller: data.controller,
        publicKeys: data.publicKeys || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        active: data.active,
      };
    } catch (error) {
      console.error('Error fetching DID:', error);
      return null;
    }
  }

  async getInstitution(address: string) {
    try {
      const hasPallet = await checkPalletAvailability(this.api, 'did');
      if (!hasPallet) {
        console.warn('DID pallet not available');
        return null;
      }

      const institution = await this.api.query.did.institutions(address);

      if (institution.isEmpty) {
        return null;
      }

      const data = institution.toJSON() as any;

      return {
        name: data.name,
        did: data.did,
        verified: data.verified,
        registeredAt: data.registeredAt,
      };
    } catch (error) {
      console.error('Error fetching institution:', error);
      return null;
    }
  }

  async isInstitution(address: string): Promise<boolean> {
    const institution = await this.getInstitution(address);
    return institution !== null;
  }

  async isVerifiedInstitution(address: string): Promise<boolean> {
    const institution = await this.getInstitution(address);
    return institution?.verified === true;
  }

  async getAllInstitutions(): Promise<any[]> {
    try {
      const hasPallet = await checkPalletAvailability(this.api, 'did');
      if (!hasPallet) return [];

      const entries = await this.api.query.did.institutions.entries();

      return entries
        .map(([key, value]) => {
          if (value.isEmpty) return null;

          const address = key.args[0].toString();
          const data = value.toJSON() as any;

          return {
            address,
            name: data.name,
            verified: data.verified,
            registeredAt: data.registeredAt,
          };
        })
        .filter(Boolean);
    } catch (error) {
      console.error('Error fetching all institutions:', error);
      return [];
    }
  }
}

/**
 * Enhanced Credential Queries with real blockchain data
 */
export class RealCredentialQueries {
  constructor(private api: ApiPromise) { }

  async getCredential(credentialId: string) {
    try {
      const hasPallet = await checkPalletAvailability(this.api, 'credential');
      if (!hasPallet) {
        console.warn('Credential pallet not available');
        return null;
      }

      const credential = await this.api.query.credential.credentials(credentialId);

      if (credential.isEmpty) {
        return null;
      }

      const data = credential.toJSON() as any;
      return formatCredentialData(data);
    } catch (error) {
      console.error('Error fetching credential:', error);
      return null;
    }
  }

  async getCredentialByHash(credentialHash: string) {
    try {
      const hasPallet = await checkPalletAvailability(this.api, 'credential');
      if (!hasPallet) {
        console.warn('Credential pallet not available');
        return null;
      }

      const credentialId = await this.api.query.credential.credentialByHash(credentialHash);

      if (credentialId.isEmpty) {
        return null;
      }

      const id = credentialId.toString();
      return this.getCredential(id);
    } catch (error) {
      console.error('Error fetching credential by hash:', error);
      return null;
    }
  }

  async getCredentialsByHolder(holderAddress: string) {
    try {
      const hasPallet = await checkPalletAvailability(this.api, 'credential');
      if (!hasPallet) {
        console.warn('Credential pallet not available');
        return [];
      }

      const credentials = await this.api.query.credential.credentialsByHolder(holderAddress);

      if (credentials.isEmpty) {
        return [];
      }

      const credentialRefs = credentials.toJSON() as any[];

      // Fetch full credentials
      const fullCredentials = await Promise.all(
        credentialRefs.map(async (ref) => {
          try {
            return await this.getCredential(ref.credentialId);
          } catch (error) {
            console.error('Error fetching credential:', error);
            return null;
          }
        })
      );

      return fullCredentials.filter(c => c !== null);
    } catch (error) {
      console.error('Error fetching credentials by holder:', error);
      return [];
    }
  }

  async getCredentialsByIssuer(issuerAddress: string) {
    try {
      const hasPallet = await checkPalletAvailability(this.api, 'credential');
      if (!hasPallet) {
        console.warn('Credential pallet not available');
        return [];
      }

      const credentialIds = await this.api.query.credential.credentialsByIssuer(issuerAddress);

      if (credentialIds.isEmpty) {
        return [];
      }

      const ids = credentialIds.toJSON() as string[];

      // Fetch full credentials
      const fullCredentials = await Promise.all(
        ids.map(async (id) => {
          try {
            return await this.getCredential(id);
          } catch (error) {
            console.error('Error fetching credential:', error);
            return null;
          }
        })
      );

      return fullCredentials.filter(c => c !== null);
    } catch (error) {
      console.error('Error fetching credentials by issuer:', error);
      return [];
    }
  }

  async verifyCredentialExists(credentialHash: string): Promise<boolean> {
    try {
      const credential = await this.getCredentialByHash(credentialHash);
      return credential !== null;
    } catch (error) {
      console.error('Error verifying credential:', error);
      return false;
    }
  }
}

/**
 * Enhanced Reputation Queries with real blockchain data
 */
export class RealReputationQueries {
  constructor(private api: ApiPromise) { }

  async getReputationScore(address: string) {
    try {
      const hasPallet = await checkPalletAvailability(this.api, 'reputation');
      if (!hasPallet) {
        console.warn('Reputation pallet not available');
        return {
          credentialsIssued: 0,
          credentialsVerified: 0,
          endorsementsReceived: 0,
          endorsementsGiven: 0,
          totalScore: 0,
        };
      }

      const score = await this.api.query.reputation.reputationScores(address);

      if (score.isEmpty) {
        return {
          credentialsIssued: 0,
          credentialsVerified: 0,
          endorsementsReceived: 0,
          endorsementsGiven: 0,
          totalScore: 0,
        };
      }

      return score.toJSON() as any;
    } catch (error) {
      console.error('Error fetching reputation score:', error);
      return {
        credentialsIssued: 0,
        credentialsVerified: 0,
        endorsementsReceived: 0,
        endorsementsGiven: 0,
        totalScore: 0,
      };
    }
  }

  async getEndorsementsReceived(address: string) {
    try {
      const hasPallet = await checkPalletAvailability(this.api, 'reputation');
      if (!hasPallet) return [];

      const endorsements = await this.api.query.reputation.endorsementsReceived(address);

      if (endorsements.isEmpty) {
        return [];
      }

      return endorsements.toJSON() as any[];
    } catch (error) {
      console.error('Error fetching endorsements received:', error);
      return [];
    }
  }

  async getEndorsementsGiven(address: string) {
    try {
      const hasPallet = await checkPalletAvailability(this.api, 'reputation');
      if (!hasPallet) return [];

      const endorsements = await this.api.query.reputation.endorsementsGiven(address);

      if (endorsements.isEmpty) {
        return [];
      }

      return endorsements.toJSON() as any[];
    } catch (error) {
      console.error('Error fetching endorsements given:', error);
      return [];
    }
  }
}

/**
 * Combined Real Queries Helper
 */
export class RealBlockchainQueries {
  did: RealDIDQueries;
  credential: RealCredentialQueries;
  reputation: RealReputationQueries;

  constructor(api: ApiPromise) {
    this.did = new RealDIDQueries(api);
    this.credential = new RealCredentialQueries(api);
    this.reputation = new RealReputationQueries(api);
  }

  /**
   * Get comprehensive user data
   */
  async getUserData(address: string) {
    try {
      const [did, institution, credentials, reputation] = await Promise.all([
        this.did.getDID(address),
        this.did.getInstitution(address),
        this.credential.getCredentialsByHolder(address),
        this.reputation.getReputationScore(address),
      ]);

      return {
        did,
        institution,
        credentials,
        reputation,
        isInstitution: institution !== null,
        isVerified: institution?.verified || false,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  /**
   * Get institution data with issued credentials
   */
  async getInstitutionData(address: string) {
    try {
      const [institution, issuedCredentials, reputation, endorsementsReceived] = await Promise.all([
        this.did.getInstitution(address),
        this.credential.getCredentialsByIssuer(address),
        this.reputation.getReputationScore(address),
        this.reputation.getEndorsementsReceived(address),
      ]);

      return {
        institution,
        issuedCredentials,
        reputation,
        endorsementsReceived,
        isVerified: institution?.verified || false,
      };
    } catch (error) {
      console.error('Error fetching institution data:', error);
      return null;
    }
  }
}