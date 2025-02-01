#!/bin/bash

# Exit on error
set -e

echo "🚀 Building NestJS application for Lambda deployment..."

# Navigate to project root
cd ..

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the NestJS application
echo "🔨 Building application..."
npm run build

# Create deployment package directory
echo "📁 Creating deployment package..."
rm -rf dist/lambda
mkdir -p dist/lambda

# Copy necessary files
cp -r dist/src/* dist/lambda/
cp package.json dist/lambda/
cp package-lock.json dist/lambda/

# Create Lambda handler
cat > dist/lambda/lambda.js << EOL
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./app.module');
const serverlessExpress = require('@vendia/serverless-express');

let server;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.init();
  
  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

exports.handler = async (event, context) => {
  server = server ?? (await bootstrap());
  return server(event, context);
};
EOL

# Install production dependencies in the lambda package
cd dist/lambda
npm install --production

# Clean up
echo "🧹 Cleaning up..."
rm -rf node_modules/@types

echo "✅ Build complete! Lambda package is ready in dist/lambda" 