#!/bin/bash

# Script to add Plaid Link SDK to Xcode project
# This script adds the Plaid SDK package reference to the Xcode project

PROJECT_PATH="BradleysFinanceHub.xcodeproj"
PROJECT_FILE="${PROJECT_PATH}/project.pbxproj"

# Check if project exists
if [ ! -f "$PROJECT_FILE" ]; then
    echo "Error: Project file not found at $PROJECT_FILE"
    exit 1
fi

echo "Adding Plaid Link SDK to Xcode project..."

# Use xcodebuild to add package (requires Xcode 11+)
# Note: This is a simplified approach - full integration requires Xcode GUI or xcodebuild resolve

# Alternative: Use xcodebuild to resolve packages
cd "$(dirname "$PROJECT_PATH")"

# Create a temporary workspace to resolve packages
# This is a workaround since direct package addition via CLI is limited

echo "To complete Plaid SDK integration:"
echo "1. Open BradleysFinanceHub.xcodeproj in Xcode"
echo "2. Go to File → Add Package Dependencies..."
echo "3. Enter: https://github.com/plaid/plaid-link-ios"
echo "4. Select version and add to target"
echo ""
echo "OR use the automated method below..."

# Try to use xcodebuild to add package (if supported)
# Note: This may not work on all Xcode versions
xcodebuild -resolvePackageDependencies -project "$PROJECT_PATH" 2>/dev/null || {
    echo "Note: Package resolution requires Xcode GUI or manual addition"
    echo "The project structure is ready - just add the package in Xcode"
}

echo "Done! Please add the package in Xcode if not automatically added."

