#!/bin/sh
# Xcode Cloud Post-Build Script
# This script runs after Xcode builds your project

set -e

echo "🎉 Starting Xcode Cloud post-build script..."

# Print build information
echo "📋 Build Information:"
echo "  CI: $CI"
echo "  BUILD_NUMBER: $CI_BUILD_NUMBER"
echo "  WORKFLOW: $CI_WORKFLOW"

# Verify build artifacts
if [ -d "$CI_ARCHIVE_PATH" ]; then
    echo "✅ Archive created at: $CI_ARCHIVE_PATH"
else
    echo "⚠️  Archive path not found (this is normal for test workflows)"
fi

# Count Swift files
SWIFT_COUNT=$(find BradleysFinanceHub -name "*.swift" | wc -l | tr -d ' ')
echo "📊 Project Statistics:"
echo "  Swift files: $SWIFT_COUNT"

echo "✅ Post-build script completed successfully"

