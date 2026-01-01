// src/lib/blockchain/queries.ts
import type { ApiPromise } from '@polkadot/api';

/**
 * Query DID information
 */
export class DIDQueries {
  constructor(private api: ApiPromise) {}

  async getDID(address: string) {
    try {
      const didDoc = await this.api.query.did.didDocuments(address);
      if (didDoc.isEmpty) {
        return null;
      }
      return didDoc.toJSON();
    } catch (error) {
      console.error('Error fetching DID:', error);
      return null;
    }
  }

  async getInstitution(address: string) {
    try {
      const institution = await this.api.query.did.institutions(address);
      if (institution.isEmpty) {
        return null;
      }
      return institution.toJSON();
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
}

/**
 * Query Credential information
 */
export class CredentialQueries {
  constructor(private api: ApiPromise) {}

  async getCredential(credentialId: string) {
    try {
      const credential = await this.api.query.credential.credentials(credentialId);
      if (credential.isEmpty) {
        return null;
      }
      return credential.toJSON();
    } catch (error) {
      console.error('Error fetching credential:', error);
      return null;
    }
  }

  async getCredentialByHash(credentialHash: string) {
    try {
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
      const credentials = await this.api.query.credential.credentialsByHolder(holderAddress);
      if (credentials.isEmpty) {
        return [];
      }
      
      const credentialRefs = credentials.toJSON() as any[];
      
      // Fetch full credentials
      const fullCredentials = await Promise.all(
        credentialRefs.map(ref => this.getCredential(ref.credentialId))
      );
      
      return fullCredentials.filter(c => c !== null);
    } catch (error) {
      console.error('Error fetching credentials by holder:', error);
      return [];
    }
  }

  async getCredentialsByIssuer(issuerAddress: string) {
    try {
      const credentialIds = await this.api.query.credential.credentialsByIssuer(issuerAddress);
      if (credentialIds.isEmpty) {
        return [];
      }
      
      const ids = credentialIds.toJSON() as string[];
      
      // Fetch full credentials
      const fullCredentials = await Promise.all(
        ids.map(id => this.getCredential(id))
      );
      
      return fullCredentials.filter(c => c !== null);
    } catch (error) {
      console.error('Error fetching credentials by issuer:', error);
      return [];
    }
  }
}

/**
 * Query Reputation information
 */
export class ReputationQueries {
  constructor(private api: ApiPromise) {}

  async getReputationScore(address: string) {
    try {
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
      return score.toJSON();
    } catch (error) {
      console.error('Error fetching reputation score:', error);
      return null;
    }
  }

  async getEndorsementsReceived(address: string) {
    try {
      const endorsements = await this.api.query.reputation.endorsementsReceived(address);
      if (endorsements.isEmpty) {
        return [];
      }
      return endorsements.toJSON();
    } catch (error) {
      console.error('Error fetching endorsements received:', error);
      return [];
    }
  }

  async getEndorsementsGiven(address: string) {
    try {
      const endorsements = await this.api.query.reputation.endorsementsGiven(address);
      if (endorsements.isEmpty) {
        return [];
      }
      return endorsements.toJSON();
    } catch (error) {
      console.error('Error fetching endorsements given:', error);
      return [];
    }
  }
}

/**
 * Combined queries helper
 */
export class BlockchainQueries {
  did: DIDQueries;
  credential: CredentialQueries;
  reputation: ReputationQueries;

  constructor(api: ApiPromise) {
    this.did = new DIDQueries(api);
    this.credential = new CredentialQueries(api);
    this.reputation = new ReputationQueries(api);
  }
}