#!/bin/sh
# Xcode Cloud Pre-Build Script
# This script runs before Xcode builds your project

set -e

echo "🚀 Starting Xcode Cloud pre-build script..."

# Print environment information
echo "📋 Environment:"
echo "  CI: $CI"
echo "  XCODE_CLOUD: $XCODE_CLOUD"
echo "  BUILD_NUMBER: $CI_BUILD_NUMBER"
echo "  WORKFLOW: $CI_WORKFLOW"

# Verify project structure
if [ ! -d "BradleysFinanceHub" ]; then
    echo "❌ Error: BradleysFinanceHub directory not found"
    exit 1
fi

if [ ! -f "BradleysFinanceHub.xcodeproj/project.pbxproj" ]; then
    echo "❌ Error: Xcode project not found"
    exit 1
fi

echo "✅ Project structure verified"
echo "✅ Pre-build script completed successfully"

