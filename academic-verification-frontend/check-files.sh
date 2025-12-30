#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Checking Required Files..."
echo ""

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 (MISSING)${NC}"
        return 1
    fi
}

missing_count=0

echo "📁 Checking UI Components..."
check_file "src/components/ui/Badge.tsx" || ((missing_count++))
check_file "src/components/ui/Button.tsx" || ((missing_count++))
check_file "src/components/ui/Card.tsx" || ((missing_count++))
check_file "src/components/ui/Input.tsx" || ((missing_count++))
check_file "src/components/ui/Modal.tsx" || ((missing_count++))
check_file "src/components/ui/Spinner.tsx" || ((missing_count++))
check_file "src/components/ui/index.ts" || ((missing_count++))

echo ""
echo "📁 Checking Layout Components..."
check_file "src/components/layout/MainLayout.tsx" || ((missing_count++))
check_file "src/components/layout/Header.tsx" || ((missing_count++))
check_file "src/components/layout/Sidebar.tsx" || ((missing_count++))
check_file "src/components/layout/Footer.tsx" || ((missing_count++))

echo ""
echo "📁 Checking Blockchain Components..."
check_file "src/components/blockchain/WalletConnect.tsx" || ((missing_count++))
check_file "src/components/blockchain/ChainStatus.tsx" || ((missing_count++))

echo ""
echo "📁 Checking DID Components..."
check_file "src/components/did/DIDStatus.tsx" || ((missing_count++))

echo ""
echo "📁 Checking Utilities..."
check_file "src/lib/utils/cn.ts" || ((missing_count++))
check_file "src/lib/utils/constants.ts" || ((missing_count++))

echo ""
echo "📁 Checking Stores..."
check_file "src/store/wallet.store.ts" || ((missing_count++))
check_file "src/store/did.store.ts" || ((missing_count++))
check_file "src/store/credentials.store.ts" || ((missing_count++))
check_file "src/store/ui.store.ts" || ((missing_count++))

echo ""
echo "📁 Checking Providers..."
check_file "src/providers/PolkadotProvider.tsx" || ((missing_count++))
check_file "src/providers/WalletProvider.tsx" || ((missing_count++))

echo ""
echo "📁 Checking Hooks..."
check_file "src/hooks/blockchain/usePolkadotApi.ts" || ((missing_count++))

echo ""
echo "📁 Checking Pages..."
check_file "src/pages/Home.tsx" || ((missing_count++))
check_file "src/pages/Dashboard.tsx" || ((missing_count++))
check_file "src/pages/Credentials.tsx" || ((missing_count++))
check_file "src/pages/Institution.tsx" || ((missing_count++))
check_file "src/pages/Verify.tsx" || ((missing_count++))
check_file "src/pages/Institutions.tsx" || ((missing_count++))

echo ""
echo "📁 Checking Main Files..."
check_file "src/App.tsx" || ((missing_count++))
check_file "src/main.tsx" || ((missing_count++))
check_file "src/index.css" || ((missing_count++))

echo ""
echo "📁 Checking Config Files..."
check_file "tsconfig.json" || ((missing_count++))
check_file "vite.config.ts" || ((missing_count++))
check_file "tailwind.config.js" || ((missing_count++))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $missing_count -eq 0 ]; then
    echo -e "${GREEN}🎉 All required files are present!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm install (if you haven't already)"
    echo "2. Run: npm run dev"
    echo "3. Open: http://localhost:5174"
else
    echo -e "${RED}⚠️  Missing $missing_count file(s)${NC}"
    echo ""
    echo "Please create the missing files listed above."
    echo "Refer to the artifacts provided by Claude."
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"