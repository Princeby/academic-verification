# Academic Verification System

A fully decentralized academic credential verification platform built on Polkadot. Students, institutions, and verifiers can issue, manage, and verify academic credentials on the blockchain.

---

## 🌟 Features

**Students**

* Self-sovereign DID management
* Store, share, and request credentials
* Generate verifiable proofs

**Institutions**

* Issue tamper-proof credentials
* Manage requests and batch operations
* Reputation tracking & analytics

**Verifiers**

* Instant, hash-based verification
* QR code support, public access
* Blockchain-backed cryptographic proof

---

## 🏗️ Architecture

**Frontend:** React, TypeScript, Vite, TailwindCSS, Zustand, React Router, TanStack Query
**Blockchain:** Polkadot.js API with custom pallets (`did`, `credential`, `reputation`)
**Key Libraries:** `@polkadot/api`, `@polkadot/extension-dapp`, `@polkadot/util-crypto`, `react-hook-form + zod`, `sonner`, `lucide-react`

---

## 📋 Prerequisites

* Node.js 18+
* Polkadot wallet (Polkadot.js, Talisman, SubWallet)
* Local node at `ws://127.0.0.1:9944`

---

## 🚀 Quick Start

```bash
git clone https://github.com/yourusername/academic-verification.git
cd academic-verification/frontend
npm install
```

Create `.env`:

```env
VITE_WS_PROVIDER=ws://127.0.0.1:9944
VITE_CHAIN_NAME=Academic Verification Chain
VITE_TOKEN_SYMBOL=AVC
VITE_TOKEN_DECIMALS=12
VITE_APP_NAME=Academic Verify
VITE_APP_VERSION=1.0.0
```

Start development server:

```bash
npm run dev
```

---

## 📱 Key Features

### DID Creation

```typescript
const { publicKey, mnemonic, address } = await generateKeys();
await createDID(publicKey, 'Ed25519');
```

### Credential Issuance

```typescript
await issueCredential({
  holder: studentDID,
  credentialHash: docHash,
  credentialType: "Bachelor",
  metadata: data
});
```

### Credential Verification

```typescript
const result = await verifyCredential(credentialHash);
```

---

## 🔐 Security

* Self-sovereign identity
* Blake2 hashing & on-chain storage
* Privacy-first, peer-to-peer verification
* Secure key management

---

## 🎨 UI/UX

* Mobile-first, dark mode support
* Real-time blockchain sync
* Loading states & toast notifications
* Accessible ARIA navigation

---

## 🧪 Testing

```bash
npm run test       # Unit tests
npm run test:e2e   # End-to-end tests
npm run test:coverage
```

---

## 🔨 Build & Deploy

```bash
npm run build
npm run preview
# Deploy: Vercel/Netlify auto from GitHub
```

---

## 🤝 Contributing

* Fork & create a branch
* Commit & push changes
* Open a Pull Request
* Use TypeScript, ESLint, meaningful commit messages, and add tests

---

## 🐛 Troubleshooting

* **Wallet:** Install Polkadot.js extension
* **Node timeout:** Ensure `ws://127.0.0.1:9944` is running
* **Build errors:**

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 License

MIT License

## 👥 Team

Your Name - Project Lead - @Princeby

## 🙏 Acknowledgments

Polkadot ecosystem, Substrate pallets, open source libraries
