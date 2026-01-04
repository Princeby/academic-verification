Academic Verification System
Decentralized academic credential verification on Polkadot
Issue, verify, and manage academic credentials with blockchain-powered security and instant verification.
Show Image
Show Image
Show Image

What is Academic Verify?
Academic Verify is a decentralized platform that enables:

Students to own and control their academic credentials
Institutions to issue tamper-proof digital credentials
Anyone to instantly verify credential authenticity

Built on Polkadot's Substrate framework, credentials are cryptographically secured and permanently stored on-chain.

Quick Start
Prerequisites

Rust (1.70+)
Node.js (18+)
Polkadot.js Extension

Run the Blockchain Node
bash# Clone the repository
git clone https://github.com/your-username/academic-verification.git
cd academic-verification

# Build and run local node
cargo run --release -- --dev --tmp
Node available at: ws://127.0.0.1:9944
Run the Frontend
bashcd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_WS_PROVIDER=ws://127.0.0.1:9944" > .env

# Start development server
npm run dev
```

App available at: `http://localhost:5174`

---

## Key Features

### 🎓 For Students
- Create self-sovereign digital identity (DID)
- Receive verifiable credentials from institutions
- Share credentials with one click
- Request credentials from any institution

### 🏛️ For Institutions
- Issue tamper-proof credentials in seconds
- Manage all issued credentials
- Review and approve credential requests
- Build institutional reputation on-chain

### ✅ For Verifiers
- Instant credential verification (no account needed)
- Cryptographic proof of authenticity
- View issuer reputation
- Export verification reports

---

## Architecture
```
┌─────────────────────────────────────┐
│         React Frontend              │
│   (Wallet + UI + State)             │
└──────────────┬──────────────────────┘
               │ Polkadot.js API
┌──────────────▼──────────────────────┐
│      Substrate Runtime              │
│  ┌─────┐  ┌─────────┐  ┌─────────┐ │
│  │ DID │  │Credential│ │Reputation│ │
│  └─────┘  └─────────┘  └─────────┘ │
└─────────────────────────────────────┘
```

**3 Custom Pallets:**
- **DID**: Identity management for users and institutions
- **Credential**: Issue, revoke, and verify credentials
- **Reputation**: Track institutional reputation and endorsements

---

## Project Structure
```
academic-verification/
├── pallets/                    # Substrate pallets
│   ├── did/                    # Identity management
│   ├── credential/             # Credential issuance
│   └── reputation/             # Reputation system
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── lib/blockchain/    # Blockchain integration
│   │   ├── pages/             # Application pages
│   │   └── store/             # State management
│   └── package.json
└── runtime/                   # Your runtime integration

Usage Examples
Create a DID
typescript// Connect wallet → Dashboard → Create DID
const tx = api.tx.did.createDid(publicKey, 'Ed25519');
await tx.signAndSend(account);
Issue a Credential (Institution)
typescriptconst tx = api.tx.credential.issueCredential(
  holderDID,
  blake2Hash(document),
  'Degree',
  metadata,
  expirationDate
);
await tx.signAndSend(institutionAccount);
Verify a Credential (Anyone)
typescript// No authentication required - just paste hash
const credential = await api.query.credential.credentialByHash(hash);
// Returns: Valid ✅ | Revoked ⚠️ | Not Found ❌

Testing
Backend Tests
bash# Run all pallet tests
cargo test

# Test specific pallet
cd pallets/credential
cargo test
Frontend Testing
bashcd frontend
npm run lint
npm run type-check

Deployment
Production Build
bash# Backend
cargo build --release

# Frontend
cd frontend
npm run build
Deploy Frontend
bash# Vercel (recommended)
npm i -g vercel
vercel deploy

# Or Netlify
npm i -g netlify-cli
netlify deploy --prod

Documentation

API Reference: [Link to docs]
User Guide: [Link to guide]
Video Tutorial: [Link to video]


Contributing
We welcome contributions! See CONTRIBUTING.md for guidelines.
bash# Fork → Clone → Create branch
git checkout -b feature/your-feature

# Make changes → Test → Commit
git commit -m "Add: your feature"

# Push → Open PR
git push origin feature/your-feature

Support

Issues: GitHub Issues
Discussions: GitHub Discussions
Email: support@academicverify.com


License
MIT License - see LICENSE for details

Built With
Substrate • Polkadot • React • TypeScript

<sub>Made with ❤️ by the Academic Verify Team</sub>
