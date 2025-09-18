#!/usr/bin/env python3
"""
Create a professional advertisement video with better pacing and effects
"""

import os
import subprocess
import sys

def create_enhanced_ad():
    """Create enhanced advertisement with better timing"""
    print("🎬 Creating Enhanced Professional Advertisement...")
    
    # Create video with better pacing (3 seconds per scene)
    cmd = [
        'ffmpeg',
        '-y',
        '-framerate', '1/3',  # 3 seconds per frame
        '-pattern_type', 'glob',
        '-i', 'ad_video/*.png',
        '-i', 'ad_voiceover.mp3',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        '-crf', '20',  # Higher quality
        '-preset', 'slow',  # Better compression
        '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',  # Ensure 1920x1080
        'bradley_financial_tools_professional_ad.mp4'
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        print("✅ Enhanced professional advertisement created!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error creating enhanced video: {e}")
        return False

def create_short_version():
    """Create a shorter 30-second version for social media"""
    print("📱 Creating 30-second social media version...")
    
    # Create shorter version by speeding up the video
    cmd = [
        'ffmpeg',
        '-y',
        '-i', 'bradley_financial_tools_professional_ad.mp4',
        '-filter_complex', '[0:v]setpts=0.8*PTS[v];[0:a]atempo=1.25[a]',
        '-map', '[v]',
        '-map', '[a]',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-crf', '20',
        'bradley_financial_tools_30sec.mp4'
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        print("✅ 30-second social media version created!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error creating short version: {e}")
        return False

def main():
    """Create professional advertisement videos"""
    print("🎬 Creating Professional Advertisement Videos")
    print("=" * 50)
    
    # Create enhanced version
    if create_enhanced_ad():
        # Create short version
        create_short_version()
        
        print("\n🎉 SUCCESS! Professional advertisement videos created!")
        print("📁 Files created:")
        print("  - bradley_financial_tools_professional_ad.mp4 (Full professional ad)")
        print("  - bradley_financial_tools_30sec.mp4 (30-second social media version)")
        print("  - ad_voiceover.mp3 (Voice-over audio)")
        
        # Show file sizes
        files = ['bradley_financial_tools_professional_ad.mp4', 'bradley_financial_tools_30sec.mp4']
        for file in files:
            if os.path.exists(file):
                size = os.path.getsize(file) / (1024 * 1024)  # MB
                print(f"  - {file}: {size:.1f} MB")
        
        print("\n🎯 Your advertisements are ready for:")
        print("  - YouTube and social media")
        print("  - Website homepage hero section")
        print("  - Portfolio and investor presentations")
        print("  - Marketing campaigns")
    else:
        print("❌ Failed to create enhanced advertisement")

if __name__ == "__main__":
    main()
