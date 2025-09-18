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

# Test environment validation
echo "🔐 Testing environment validation..."
if [ -f ".env" ]; then
  echo "📋 Testing environment validation with .env file..."

  # Test agent environment validation
  cd apps/agent
  if node -e "require('./dist/env.js').validateEnv()" 2>/dev/null; then
    echo "✅ Agent environment validation passed"
  else
    echo "⚠️  Agent environment validation failed (expected if credentials not configured)"
  fi
  cd ../..

  # Test web environment validation
  cd apps/web
  if node -e "require('./src/env.ts').env" 2>/dev/null; then
    echo "✅ Web environment validation passed"
  else
    echo "⚠️  Web environment validation failed (expected if not configured)"
  fi
  cd ../..
else
  echo "⚠️  No .env file found - skipping environment validation"
  echo "   Run 'cp .env.example .env' to enable environment validation testing"
fi

echo ""
echo "🎉 CausalOps monorepo setup validation complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and configure credentials:"
echo "   • For Elastic Cloud: Set ELASTIC_CLOUD_ID and ELASTIC_API_KEY"
echo "   • For Local Elasticsearch: Set ELASTIC_NODE, ELASTIC_USERNAME, ELASTIC_PASSWORD"
echo "   • Set VERTEX_AI_PROJECT_ID and VERTEX_AI_LOCATION for AI features"
echo "2. Run 'pnpm env-check' to validate environment configuration"
echo "3. Run 'pnpm dev' to start development servers"
echo "4. Begin implementing COP-1.x tasks (Elastic Data Plane)"
echo ""