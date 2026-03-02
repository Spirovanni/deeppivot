#!/bin/bash

# Vercel CLI Deployment Script with Detailed Logging
# This script attempts to deploy via Vercel CLI to get better error messages

set -e

echo "=================================================="
echo "Vercel CLI Deployment Diagnostic"
echo "=================================================="
echo ""

# Check if logged in
echo "Checking Vercel authentication..."
if ! vercel whoami 2>/dev/null; then
    echo "Not logged in to Vercel. Please run: vercel login"
    exit 1
fi

echo "✓ Authenticated"
echo ""

# Show current project info
echo "Current project info:"
vercel inspect 2>/dev/null || echo "(No deployment info available yet)"
echo ""

# Attempt deployment
echo "=================================================="
echo "Starting Vercel deployment..."
echo "=================================================="
echo ""
echo "Options:"
echo "  1. Preview deployment (faster, safer)"
echo "  2. Production deployment"
echo ""
read -p "Select option (1 or 2): " DEPLOY_OPTION

if [ "$DEPLOY_OPTION" = "1" ]; then
    echo ""
    echo "Starting PREVIEW deployment..."
    echo ""
    vercel --debug 2>&1 | tee vercel-deploy.log
elif [ "$DEPLOY_OPTION" = "2" ]; then
    echo ""
    echo "Starting PRODUCTION deployment..."
    echo ""
    vercel --prod --debug 2>&1 | tee vercel-deploy.log
else
    echo "Invalid option selected"
    exit 1
fi

echo ""
echo "=================================================="
echo "Deployment attempt complete"
echo "=================================================="
echo ""
echo "Log saved to: vercel-deploy.log"
echo ""

if [ $? -eq 0 ]; then
    echo "✓ Deployment succeeded!"
else
    echo "✗ Deployment failed. Check vercel-deploy.log for details."
    echo ""
    echo "Common issues:"
    echo "  - Account limits exceeded"
    echo "  - Infrastructure issues"
    echo "  - Configuration problems"
    echo ""
    echo "Next steps:"
    echo "  1. Review vercel-deploy.log"
    echo "  2. Contact Vercel support with the log"
    echo "  3. Check https://vercel.com/[team]/settings/usage"
fi
