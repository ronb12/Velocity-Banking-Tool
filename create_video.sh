#!/bin/bash

# Create MP4 video from demo images
echo "🎬 Creating MP4 video from demo images..."

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install ffmpeg
        else
            echo "Please install FFmpeg manually: https://ffmpeg.org/download.html"
            exit 1
        fi
    else
        echo "Please install FFmpeg manually: https://ffmpeg.org/download.html"
        exit 1
    fi
fi

# Create MP4 video with 2-second duration per frame
ffmpeg -framerate 0.5 -i demo_video/%02d_%s.png -c:v libx264 -pix_fmt yuv420p -crf 23 app_demo.mp4

echo "✅ MP4 video created: app_demo.mp4"
echo "📁 File size: $(ls -lh app_demo.mp4 | awk '{print $5}')"
echo "🎉 High-quality demo video ready for sharing!"
