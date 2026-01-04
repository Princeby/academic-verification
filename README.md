<artifact identifier="dev-setup-guide" type="text/markdown" title="Academic Verification System - Developer Setup Guide">
Academic Verification System - Developer Setup Guide

A fully decentralized academic credential verification platform built on Polkadot. Students, institutions, and verifiers can issue, manage, and verify academic credentials on the blockchain.

---

## 🌟 Features

### Students
- 🔑 Self-sovereign DID management
- 📄 Store, share, and request credentials
- ✅ Generate verifiable proofs
- 📱 Mobile-friendly interface

### Institutions
- 🎓 Issue tamper-proof credentials
- 📋 Manage credential requests
- 📊 Reputation tracking & analytics
- 👥 Batch operations support

### Verifiers
- ⚡ Instant hash-based verification
- 📷 QR code support
- 🌐 Public access (no wallet required)
- 🔒 Blockchain-backed cryptographic proof

---

## 🏗️ Architecture

**Frontend Stack:**
- ⚛️ React 19 + TypeScript
- ⚡ Vite 7
- 🎨 Tailwind CSS v4
- 🗂️ Zustand (State Management)
- 🔀 React Router v7
- 🔄 TanStack Query
- 📝 React Hook Form + Zod

**Blockchain:**
- 🔗 Polkadot.js API
- 🎯 Custom Pallets: `did`, `credential`, `reputation`
- 🔐 Substrate-based chain

**Key Libraries:**
- `@polkadot/api` - Blockchain interaction
- `@polkadot/extension-dapp` - Wallet integration
- `@polkadot/util-crypto` - Cryptographic utilities
- `sonner` - Toast notifications
- `lucide-react` - Icon system

---

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 18+** ([Download](https://nodejs.org/))
- ✅ **npm or yarn** (comes with Node.js)
- ✅ **Polkadot Wallet Extension**:
  - [Polkadot.js Extension](https://polkadot.js.org/extension/)
  - [Talisman](https://talisman.xyz/)
  - [SubWallet](https://subwallet.app/)
- ✅ **Local Substrate Node** running at `ws://127.0.0.1:9944`
- ✅ **Git** ([Download](https://git-scm.com/))

---

## 🚀 Quick Start

### 1️⃣ Start the Substrate Node

First, you need to run your custom Substrate node with the Academic Verification pallets:
```bash
# Navigate to your substrate node directory
cd /path/to/substrate-node

# Build the node (first time only)
cargo build --release

# Run the node in development mode
./target/release/node-template --dev --tmp

# OR if using a different setup:
cargo run --release -- --dev
```

**Expected Output:**
```
🏁 Local node identity is: 12D3KooW...
💤 Idle (0 peers), best: #0 (0x...)
🔨 Idle (0 peers), best: #1 (0x...)
```

Keep this terminal running!

---

### 2️⃣ Clone & Setup Frontend

Open a **new terminal** and run:
```bash
# Clone the repository
git clone https://github.com/yourusername/academic-verification.git
cd academic-verification/frontend

# Install dependencies
npm install

# Verify installation
npm run check-files
```

---

### 3️⃣ Configure Environment

Create a `.env` file in the frontend root:
```bash
# Copy example environment file
cp .env.example .env
```

Update `.env` with your settings:
```env
# Blockchain Connection
VITE_WS_PROVIDER=ws://127.0.0.1:9944

# Chain Configuration
VITE_CHAIN_NAME=Academic Verification Chain
VITE_TOKEN_SYMBOL=AVC
VITE_TOKEN_DECIMALS=12

# Application
VITE_APP_NAME=Academic Verify
VITE_APP_VERSION=1.0.0

# Features (optional)
VITE_ENABLE_DEMO_MODE=true
VITE_DEMO_CREDENTIALS=true
```

---

### 4️⃣ Start Development Server
```bash
npm run dev
```

**Expected Output:**
```
  VITE v7.2.4  ready in 342 ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Open your browser and navigate to: **http://localhost:5174**

---

## 📱 Application Walkthrough

### First-Time Setup

1. **Connect Wallet**
   - Click "Connect Wallet" in the header
   - Approve the connection in your wallet extension
   - Select your account

2. **Create DID**
   - Navigate to Dashboard
   - Click "Create DID"
   - Follow the 4-step process:
     - Select key type (Ed25519 recommended)
     - Generate keys
     - **IMPORTANT**: Save your recovery phrase securely!
     - Confirm and submit to blockchain

3. **For Institutions**
   - Go to Institution page
   - Click "Register as Institution"
   - Fill in institution details
   - Upload verification documents
   - Submit for verification (requires root/governance approval)

### Key User Flows

#### **Student Flow**
```
1. Connect Wallet → 2. Create DID → 3. Request Credential → 
4. Wait for Approval → 5. Receive Credential → 6. Share/Verify
```

#### **Institution Flow**
```
1. Connect Wallet → 2. Create DID → 3. Register Institution → 
4. Get Verified → 5. Review Requests → 6. Issue Credentials
```

#### **Verifier Flow**
```
1. Go to /verify → 2. Enter Credential Hash → 3. View Results
(No wallet or DID required!)
```

---

## 🔑 Core Features Guide

### DID Creation
```typescript
// Keys are generated automatically
const { publicKey, mnemonic, address } = await generateKeys();

// Submit to blockchain
await createDID(publicKey, 'Ed25519');

// Store mnemonic securely (user's responsibility)
// Never share or lose the recovery phrase!
```

### Credential Issuance
```typescript
// Institution issues credential
await issueCredential({
  holder: studentDID,              // Student's DID address
  credentialHash: documentHash,    // Blake2 hash of document
  credentialType: "Bachelor's Degree",
  metadata: JSON.stringify({
    degreeName: "B.S. Computer Science",
    fieldOfStudy: "Computer Science",
    graduationDate: "2024-05-15"
  }),
  expiresAt: optionalExpiryDate
});
```

### Credential Verification
```typescript
// Anyone can verify (no auth needed)
const result = await verifyCredential(credentialHash);

if (result.found) {
  // Credential exists on blockchain
  // Check: active, expired, or revoked
  console.log(result.credential);
} else {
  // Credential not found
}
```

### Credential Requests (NEW)
```typescript
// Student requests credential
await createRequest({
  institution: institutionDID,
  credentialType: "Bachelor's Degree",
  programName: "Computer Science",
  fieldOfStudy: "Computer Science",
  startDate: "2020-09-01",
  endDate: "2024-05-15",
  supportingDocuments: [ipfsHash1, ipfsHash2]
});
```

---

## 🔐 Security Best Practices

### Key Management
- ✅ **Recovery Phrase**: Store offline in a secure location
- ✅ **Never Share**: Don't share recovery phrase or private keys
- ✅ **Backup**: Keep multiple secure backups
- ❌ **Don't Store**: Never store in cloud services or browsers

### Credential Hash
- ✅ Uses **Blake2-256** hashing algorithm
- ✅ Document hash stored on-chain
- ✅ Original document stored off-chain (user's responsibility)
- ✅ Tamper-proof verification

### Privacy
- ✅ Self-sovereign identity (you control your DID)
- ✅ Selective disclosure (share what you want)
- ✅ No centralized database
- ✅ Blockchain transparency with privacy

---

## 🎨 UI/UX Features

- 📱 **Mobile-First Design**: Responsive on all devices
- 🌙 **Dark Mode**: Automatic system detection
- ⚡ **Real-Time Updates**: Live blockchain synchronization
- 🔔 **Notifications**: Toast notifications for all actions
- ♿ **Accessibility**: ARIA labels and keyboard navigation
- 🎭 **Loading States**: Skeleton screens and spinners
- 🎯 **Error Handling**: Graceful error messages

---

## 🧪 Testing
```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run E2E tests (future)
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 🔨 Build & Deploy

### Production Build
```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Deployment Options

#### **Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### **Netlify**
```bash
# Build command: npm run build
# Publish directory: dist
```

#### **Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5174
CMD ["npm", "run", "preview"]
```

---

## 🤝 Contributing

We welcome contributions! Here's how:

### Setup
```bash
# Fork the repo and clone your fork
git clone https://github.com/YOUR_USERNAME/academic-verification.git

# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes and commit
git commit -m "feat: add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

### Guidelines
- ✅ Use **TypeScript** for all new code
- ✅ Follow **ESLint** rules
- ✅ Write **meaningful commit messages** ([Conventional Commits](https://www.conventionalcommits.org/))
- ✅ Add **tests** for new features
- ✅ Update **documentation**
- ✅ Keep PRs **focused** and **small**

### Commit Message Format
```
<type>(<scope>): <subject>

feat(did): add public key rotation
fix(credentials): resolve verification bug
docs(readme): update installation steps
```

---

## 🐛 Troubleshooting

### Wallet Connection Issues

**Problem**: "No wallet extension found"
```bash
✅ Install Polkadot.js Extension
✅ Refresh the page
✅ Check browser console for errors
```

**Problem**: "Connection rejected"
```bash
✅ Approve connection in wallet popup
✅ Ensure wallet is unlocked
✅ Try different browser/wallet extension
```

### Node Connection Issues

**Problem**: "Could not connect to blockchain node"
```bash
# Check if node is running
curl http://127.0.0.1:9944

✅ Ensure node is running on ws://127.0.0.1:9944
✅ Check firewall settings
✅ Verify .env VITE_WS_PROVIDER is correct
```

**Problem**: "Connection timeout"
```bash
# Restart the node
Ctrl+C (in node terminal)
./target/release/node-template --dev --tmp

# Restart frontend
npm run dev
```

### Build Errors

**Problem**: "Module not found" or dependency issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm cache clean --force
```

**Problem**: "Out of memory" during build
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Runtime Errors

**Problem**: "Transaction failed"
```bash
✅ Check account has sufficient balance
✅ Verify blockchain state (pallets installed)
✅ Check browser console for detailed error
✅ Try transaction again
```

**Problem**: "DID not found"
```bash
✅ Ensure you created a DID first
✅ Refresh page to sync with blockchain
✅ Check if node restarted (--tmp flag clears data)
```

---

## 📚 Project Structure
```
academic-verification/
├── src/
│   ├── components/          # React components
│   │   ├── blockchain/      # Wallet, chain status
│   │   ├── credentials/     # Credential UI
│   │   ├── did/             # DID creation, management
│   │   ├── layout/          # Header, sidebar, footer
│   │   ├── requests/        # NEW: Request forms
│   │   └── ui/              # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   │   └── blockchain/      # Blockchain hooks
│   ├── lib/                 # Utilities
│   │   ├── blockchain/      # Blockchain integration
│   │   └── utils/           # Helper functions
│   ├── pages/               # Route pages
│   ├── providers/           # Context providers
│   ├── store/               # Zustand stores
│   └── types/               # TypeScript types
├── public/                  # Static assets
├── .env.example             # Environment template
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
└── README.md                # This file
```

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 👥 Team & Contact

**Project Lead**: Your Name  
📧 Email: your.email@example.com  
🐦 Twitter: [@yourhandle](https://twitter.com/yourhandle)  
💼 LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)

---

## 🙏 Acknowledgments

- 🔗 [Polkadot](https://polkadot.network/) - Blockchain infrastructure
- 🎯 [Substrate](https://substrate.io/) - Pallet framework
- ⚛️ [React](https://react.dev/) - UI framework
- 🎨 [Tailwind CSS](https://tailwindcss.com/) - Styling
- 🛠️ [Vite](https://vitejs.dev/) - Build tool
- 🧰 All open-source contributors

---

## 🔗 Useful Links

- 📖 [Full Documentation](https://docs.yourproject.com)
- 🎓 [Tutorials](https://docs.yourproject.com/tutorials)
- 💬 [Discord Community](https://discord.gg/yourserver)
- 🐛 [Report Issues](https://github.com/yourusername/academic-verification/issues)
- 🗺️ [Roadmap](https://github.com/yourusername/academic-verification/projects)

---

## 🚀 What's Next?

- [ ] Mobile app (React Native)
- [ ] Batch credential operations
- [ ] Advanced analytics dashboard
- [ ] Integration with IPFS for document storage
- [ ] Multi-chain support
- [ ] AI-powered credential verification

---

**Happy Building! 🎉**

If you encounter any issues or have questions, please [open an issue](https://github.com/yourusername/academic-verification/issues) or join our [Discord community](https://discord.gg/yourserver).
</artifact>
