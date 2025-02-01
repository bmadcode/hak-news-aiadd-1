#!/bin/bash

# Exit on error
set -e

STACK_NAME="hak-news"

echo "🚀 Deploying Hak News API to production environment..."

# Build the NestJS application
echo "📦 Building application..."
./scripts/build.sh

# Navigate to infrastructure directory
cd "$(dirname "$0")/.."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing infrastructure dependencies..."
  npm install
fi

# Build CDK app
echo "🔨 Building CDK app..."
npm run build

# Bootstrap CDK (if not already done)
echo "🏗️ Bootstrapping CDK..."
npx cdk bootstrap

# Deploy the stack
echo "🚀 Deploying stack ${STACK_NAME}..."
npx cdk deploy ${STACK_NAME} \
  --require-approval never \
  --outputs-file ./cdk-outputs.json

# Extract and store API key
echo "🔑 Retrieving API key..."
API_KEY_ID=$(jq -r ".\"${STACK_NAME}\".ApiKeyId" ./cdk-outputs.json)
API_KEY=$(aws apigateway get-api-key --api-key ${API_KEY_ID} --include-value | jq -r '.value')

# Save API key to environment-specific file
echo "💾 Saving API configuration..."
cat > ../.env.production << EOL
API_URL=$(jq -r ".\"${STACK_NAME}\".ApiUrl" ./cdk-outputs.json)
API_KEY=${API_KEY}
NODE_ENV=production
EOL

echo "✅ Deployment complete! Configuration saved to .env.production"
echo "📝 API URL: $(jq -r ".\"${STACK_NAME}\".ApiUrl" ./cdk-outputs.json)" 