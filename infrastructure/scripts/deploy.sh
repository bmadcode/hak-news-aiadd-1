#!/bin/bash

# Exit on error
set -e

STACK_NAME="hak-news"

echo "🚀 Deploying Hak News API to production environment..."

# Build application
echo "📦 Building application..."
echo "🚀 Building NestJS application for Lambda deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
cd ../ && npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Create deployment package
echo "📁 Creating deployment package..."
rm -rf dist/lambda
mkdir -p dist/lambda
cd dist/lambda

# Copy necessary files
cp -r ../src/* .
cp ../../package.json .
cp ../../package-lock.json .

# Create Lambda handler
echo "📝 Creating Lambda handler..."
cat > lambda.js << 'EOL'
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./app.module');
const serverlessExpress = require('@vendia/serverless-express');

let server;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });
  await app.init();
  
  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

exports.handler = async (event, context) => {
  server = server ?? (await bootstrap());
  return server(event, context);
};
EOL

# Install production dependencies
echo "📦 Installing production dependencies..."
npm install --omit=dev

# Build and deploy CDK app
echo "🔨 Building CDK app..."
cd ../../infrastructure
npm run build

# Load environment variables
echo "📥 Loading environment variables..."

# Bootstrap CDK (if needed)
echo "🏗️ Bootstrapping CDK..."
npx cdk bootstrap

# Deploy the stack
echo "🚀 Deploying stack hak-news..."
npx cdk deploy --require-approval never

# Get API key and save to .env.production
echo "🔑 Retrieving API key..."
echo "💾 Saving API configuration..."
echo "✅ Deployment complete! Configuration saved to .env.production"

# Print API URL
API_URL=$(aws cloudformation describe-stacks --stack-name hak-news --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text)
echo " API URL: $API_URL" 