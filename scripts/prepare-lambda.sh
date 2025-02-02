#!/bin/bash

# Ensure the script exits on any error
set -e

# Create dist/lambda directory if it doesn't exist
mkdir -p dist/lambda

# Copy necessary files to dist/lambda
cp -r dist/src/* dist/lambda/
cp package.json dist/lambda/
cp package-lock.json dist/lambda/

# Install production dependencies in dist/lambda
cd dist/lambda
npm ci --production

echo "Lambda deployment package prepared successfully" 