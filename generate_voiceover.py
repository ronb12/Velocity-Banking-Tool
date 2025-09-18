#!/usr/bin/env python3
"""
Generate professional voice-over for Bradley's Financial Tools advertisement
"""

import os
import subprocess
import sys

def install_requirements():
    """Install required packages for text-to-speech"""
    try:
        import gtts
        import pygame
    except ImportError:
        print("Installing required packages...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "gtts", "pygame"])
        import gtts
        import pygame

def create_voiceover():
    """Create professional voice-over audio"""
    from gtts import gTTS
    import pygame
    
    # Advertisement script
    script = """
    Tired of juggling multiple financial apps? Meet Bradley's Financial Tools - the all-in-one solution that transforms how you manage your money.
    
    With AI-powered insights and real-time analytics, our dashboard gives you a complete financial overview at a glance. See your debt, savings, and net worth all in one place.
    
    Crush your debt faster with our intelligent debt tracker. Choose between avalanche and snowball strategies, and watch your progress in real-time as you pay down high-interest debt.
    
    Take control of your spending with our zero-based budgeting system. Set categories, track expenses, and never overspend again with our smart budget alerts.
    
    Discover the power of velocity banking with our advanced calculator. See how you can pay off debt years faster using strategic credit management. Our interactive tutorial makes complex strategies simple.
    
    Track your net worth growth, estimate your credit score, and calculate your 1099 taxes - all with professional-grade tools designed for real financial success.
    
    Ready to take control of your financial future? Visit mobile-debt-tracker.web.app and start your journey to financial freedom today. Bradley's Financial Tools - where smart money management begins.
    
    Download now and join thousands of users who've already transformed their financial lives. Your future self will thank you.
    """
    
    print("🎤 Generating professional voice-over...")
    
    # Create voice-over with professional settings
    tts = gTTS(text=script, lang='en', slow=False)
    tts.save('ad_voiceover.mp3')
    
    print("✅ Voice-over audio created: ad_voiceover.mp3")
    return True

def create_ad_video():
    """Create final advertisement video with voice-over"""
    print("🎬 Creating final advertisement video...")
    
    # Create video with voice-over using FFmpeg
    cmd = [
        'ffmpeg',
        '-y',  # Overwrite output file
        '-framerate', '0.2',  # 5 seconds per frame
        '-pattern_type', 'glob',
        '-i', 'ad_video/*.png',
        '-i', 'ad_voiceover.mp3',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-pix_fmt', 'yuv420p',
        '-shortest',  # End when audio ends
        '-crf', '23',
        'bradley_financial_tools_ad.mp4'
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        print("✅ Professional advertisement video created: bradley_financial_tools_ad.mp4")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error creating video: {e}")
        return False

def main():
    """Main function to create advertisement video"""
    print("🎬 Creating Professional Advertisement Video for Bradley's Financial Tools")
    print("=" * 70)
    
    # Install requirements
    install_requirements()
    
    # Create voice-over
    if create_voiceover():
        # Create final video
        if create_ad_video():
            print("\n🎉 SUCCESS! Professional advertisement video created!")
            print("📁 Files created:")
            print("  - bradley_financial_tools_ad.mp4 (Final advertisement video)")
            print("  - ad_voiceover.mp3 (Voice-over audio)")
            print("\n🎯 Your advertisement is ready for:")
            print("  - Social media marketing")
            print("  - Website homepage")
            print("  - Portfolio presentation")
            print("  - Investor pitches")
        else:
            print("❌ Failed to create final video")
    else:
        print("❌ Failed to create voice-over")

if __name__ == "__main__":
    main()
