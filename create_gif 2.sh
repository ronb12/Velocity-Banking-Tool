#!/bin/bash

# Create animated GIF from demo images
echo "🎬 Creating animated GIF from demo images..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install imagemagick
        else
            echo "Please install ImageMagick manually: https://imagemagick.org/script/download.php"
            exit 1
        fi
    else
        echo "Please install ImageMagick manually: https://imagemagick.org/script/download.php"
        exit 1
    fi
fi

# Create animated GIF with 2-second delay between frames
convert -delay 200 -loop 0 demo_video/*.png app_demo.gif

echo "✅ Animated GIF created: app_demo.gif"
echo "📁 File size: $(ls -lh app_demo.gif | awk '{print $5}')"
echo "🎉 Demo video ready for sharing!"
