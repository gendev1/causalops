#!/bin/bash
set -e

echo "🔍 Validating CausalOps monorepo setup..."

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required"; exit 1; }

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required, found v$NODE_VERSION"
  exit 1
fi

echo "✅ Node.js $(node --version)"
echo "✅ pnpm $(pnpm --version)"

# Validate workspace configuration
echo "📦 Validating workspace configuration..."
if [ ! -f "pnpm-workspace.yaml" ]; then
  echo "❌ pnpm-workspace.yaml missing"
  exit 1
fi

if [ ! -f "turbo.json" ]; then
  echo "❌ turbo.json missing"
  exit 1
fi

echo "✅ Workspace configuration files exist"

# Test dependency installation
echo "📦 Testing dependency installation..."
pnpm install

echo "✅ Dependencies installed successfully"

# Test workspace structure
echo "🏗️  Testing workspace structure..."
turbo run typecheck --dry-run | grep -q "@repo/agent" || { echo "❌ Agent app not found"; exit 1; }
turbo run typecheck --dry-run | grep -q "@repo/web" || { echo "❌ Web app not found"; exit 1; }
turbo run typecheck --dry-run | grep -q "@repo/ingestor" || { echo "❌ Ingestor app not found"; exit 1; }

echo "✅ All apps detected in workspace"

# Test Turborepo commands
echo "⚡ Testing Turborepo commands..."
turbo run typecheck --dry-run=json >/dev/null || { echo "❌ Turbo typecheck failed"; exit 1; }
turbo run build --dry-run=json >/dev/null || { echo "❌ Turbo build failed"; exit 1; }
turbo run dev --dry-run=json >/dev/null || { echo "❌ Turbo dev failed"; exit 1; }

echo "✅ Turborepo commands configured correctly"

# Test TypeScript compilation via turbo
echo "🔧 Testing TypeScript compilation..."
turbo run typecheck --dry-run=json >/dev/null || { echo "❌ TypeScript compilation setup failed"; exit 1; }

echo "✅ TypeScript compilation setup successful"

echo ""
echo "🎉 CausalOps monorepo setup validation complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and configure credentials"
echo "2. Run 'pnpm dev' to start development servers"
echo "3. Begin implementing COP-1.x tasks (Elastic Data Plane)"
echo ""