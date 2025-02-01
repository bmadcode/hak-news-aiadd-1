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

# Load environment variables from .env.production
echo "📥 Loading environment variables..."
if [ -f "../.env.production" ]; then
  export $(cat ../.env.production | grep -v '^#' | xargs)
else
  echo "⚠️ .env.production file not found!"
  exit 1
fi

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

# Create or update environment file
echo "💾 Saving API configuration..."
ENV_FILE="../.env.production"

# If .env.production exists, preserve its contents
if [ -f "$ENV_FILE" ]; then
  # Update only API-related variables
  sed -i '' '/^API_URL=/d' "$ENV_FILE"
  sed -i '' '/^API_KEY=/d' "$ENV_FILE"
  echo "API_URL=$(jq -r ".\"${STACK_NAME}\".ApiUrl" ./cdk-outputs.json)" >> "$ENV_FILE"
  echo "API_KEY=${API_KEY}" >> "$ENV_FILE"
else
  # Create new file with required variables
  cat > "$ENV_FILE" << EOL
API_URL=$(jq -r ".\"${STACK_NAME}\".ApiUrl" ./cdk-outputs.json)
API_KEY=${API_KEY}
NODE_ENV=production
# Required LLM Settings
LLM_API_KEY=
LLM_API_URL=
LLM_MODEL=
# Required Email Settings
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EOL
  echo "⚠️ Please fill in the required environment variables in .env.production"
fi

echo "✅ Deployment complete! Configuration saved to .env.production"
echo "📝 API URL: $(jq -r ".\"${STACK_NAME}\".ApiUrl" ./cdk-outputs.json)" 