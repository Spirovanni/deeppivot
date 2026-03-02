#!/bin/bash

# Quick deployment to Fly.io as Vercel alternative

set -e

echo "=================================================="
echo "Deploying to Fly.io"
echo "=================================================="
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "Installing flyctl..."
    curl -L https://fly.io/install.sh | sh
    export FLYCTL_INSTALL="$HOME/.fly"
    export PATH="$FLYCTL_INSTALL/bin:$PATH"
fi

echo "✓ flyctl installed"
echo ""

# Login check
echo "Checking Fly.io authentication..."
if ! flyctl auth whoami 2>/dev/null; then
    echo "Please login to Fly.io:"
    flyctl auth login
fi

echo "✓ Authenticated"
echo ""

# Check if app exists
if flyctl status 2>/dev/null; then
    echo "App exists, deploying update..."
    flyctl deploy
else
    echo "Creating new app..."
    flyctl launch --now
fi

echo ""
echo "=================================================="
echo "Deployment complete!"
echo "=================================================="
echo ""
echo "Your app is now live on Fly.io"
echo ""
echo "Useful commands:"
echo "  flyctl logs - View application logs"
echo "  flyctl status - Check deployment status"
echo "  flyctl open - Open app in browser"
echo "  flyctl dashboard - Open Fly.io dashboard"
