#!/bin/bash

# Build Output Diagnostic Script
# Analyzes the .next output directory to identify potential deployment issues

echo "=================================================="
echo "Next.js Build Output Analysis"
echo "=================================================="
echo ""

if [ ! -d ".next" ]; then
    echo "❌ .next directory not found. Please run 'npm run build' first."
    exit 1
fi

echo "✓ .next directory found"
echo ""

# Overall size
echo "Total build size:"
du -sh .next
echo ""

# Standalone output
if [ -d ".next/standalone" ]; then
    echo "✓ Standalone output exists"
    echo "Standalone size:"
    du -sh .next/standalone
else
    echo "⚠ No standalone output (check next.config.js)"
fi
echo ""

# File counts
echo "File counts by type:"
echo "  JavaScript files: $(find .next -name '*.js' 2>/dev/null | wc -l)"
echo "  Source maps: $(find .next -name '*.map' 2>/dev/null | wc -l)"
echo "  HTML files: $(find .next -name '*.html' 2>/dev/null | wc -l)"
echo "  JSON files: $(find .next -name '*.json' 2>/dev/null | wc -l)"
echo "  Total files: $(find .next -type f 2>/dev/null | wc -l)"
echo ""

# Largest files
echo "Top 10 largest files:"
find .next -type f -exec du -h {} + 2>/dev/null | sort -rh | head -10
echo ""

# Server functions
if [ -d ".next/server" ]; then
    echo "Server directory size:"
    du -sh .next/server
    echo ""
    
    echo "Serverless functions:"
    if [ -d ".next/server/pages" ]; then
        find .next/server/pages -name "*.js" 2>/dev/null | head -20
        echo "  ... ($(find .next/server/pages -name "*.js" 2>/dev/null | wc -l) total)"
    fi
fi
echo ""

# Static output
if [ -d ".next/static" ]; then
    echo "Static assets size:"
    du -sh .next/static
fi
echo ""

# Potential issues
echo "=================================================="
echo "Potential Issues Detection"
echo "=================================================="
echo ""

# Check for very large files
LARGE_FILES=$(find .next -type f -size +20M 2>/dev/null)
if [ -n "$LARGE_FILES" ]; then
    echo "⚠ Found files larger than 20MB:"
    echo "$LARGE_FILES" | while read file; do
        ls -lh "$file"
    done
else
    echo "✓ No files larger than 20MB"
fi
echo ""

# Check for excessive file count
FILE_COUNT=$(find .next -type f 2>/dev/null | wc -l)
if [ $FILE_COUNT -gt 5000 ]; then
    echo "⚠ File count is high: $FILE_COUNT files"
    echo "  This may cause deployment issues on some platforms"
else
    echo "✓ File count is reasonable: $FILE_COUNT files"
fi
echo ""

# Check total size
TOTAL_SIZE=$(du -sm .next | cut -f1)
if [ $TOTAL_SIZE -gt 250 ]; then
    echo "⚠ Build output is large: ${TOTAL_SIZE}MB"
    echo "  Vercel has limits on deployment size"
else
    echo "✓ Build output size is acceptable: ${TOTAL_SIZE}MB"
fi
echo ""

echo "=================================================="
echo "Analysis Complete"
echo "=================================================="
