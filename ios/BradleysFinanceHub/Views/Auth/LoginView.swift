//
//  LoginView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authService: AuthenticationService
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var showRegister = false
    @State private var showResetPassword = false
    
    var body: some View {
        ZStack {
            // Gradient Background
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.1, green: 0.3, blue: 0.6),
                    Color(red: 0.2, green: 0.4, blue: 0.8),
                    Color(red: 0.3, green: 0.5, blue: 0.9)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            // Subtle pattern overlay
            GeometryReader { geometry in
                let positions: [(CGFloat, CGFloat, CGFloat)] = [
                    (80, 100, 60), (200, 150, 80), (320, 200, 70),
                    (120, 300, 90), (280, 350, 65), (160, 450, 75),
                    (240, 500, 85), (100, 600, 70), (300, 650, 80),
                    (180, 750, 90), (60, 400, 65), (340, 250, 75),
                    (140, 550, 85), (260, 150, 70), (200, 700, 80),
                    (120, 200, 90), (280, 600, 65), (160, 300, 75),
                    (240, 450, 85), (100, 500, 70)
                ]
                ForEach(Array(positions.enumerated()), id: \.offset) { index, pos in
                    Circle()
                        .fill(Color.white.opacity(0.03))
                        .frame(width: pos.2)
                        .position(x: pos.0, y: pos.1)
                }
            }
            
            ScrollView {
                VStack(spacing: 0) {
                    Spacer()
                        .frame(height: 60)
                    
                    // Logo Section
                    VStack(spacing: 24) {
                        // App Icon/Logo
                        ZStack {
                            // Glow effect
                            Circle()
                                .fill(
                                    LinearGradient(
                                        gradient: Gradient(colors: [
                                            Color.white.opacity(0.3),
                                            Color.white.opacity(0.1)
                                        ]),
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 140, height: 140)
                                .blur(radius: 20)
                            
                            // Icon background
                            RoundedRectangle(cornerRadius: 28)
                                .fill(Color.white)
                                .frame(width: 120, height: 120)
                                .shadow(color: Color.black.opacity(0.2), radius: 20, x: 0, y: 10)
                            
                            // App Icon
                            Image(systemName: "chart.line.uptrend.xyaxis")
                                .font(.system(size: 60, weight: .semibold))
                                .foregroundStyle(
                                    LinearGradient(
                                        gradient: Gradient(colors: [
                                            Color(red: 0.2, green: 0.5, blue: 1.0),
                                            Color(red: 0.4, green: 0.6, blue: 1.0)
                                        ]),
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                        }
                        .padding(.bottom, 8)
                        
                        // App Name
                        VStack(spacing: 8) {
                            Text("Bradley's Finance Hub")
                                .font(.system(size: 36, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                                .shadow(color: Color.black.opacity(0.2), radius: 4, x: 0, y: 2)
                            
                            Text("Take Control of Your Finances")
                                .font(.system(size: 17, weight: .medium))
                                .foregroundColor(.white.opacity(0.9))
                                .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
                        }
                    }
                    .padding(.bottom, 60)
                    
                    // Auth Section
                    VStack(spacing: 24) {
                        // Error Message
                        if let error = authService.errorMessage {
                            HStack(spacing: 8) {
                                Image(systemName: "exclamationmark.circle.fill")
                                    .foregroundColor(.white)
                                Text(error)
                                    .foregroundColor(.white)
                                    .font(.subheadline)
                            }
                            .padding()
                            .background(Color.red.opacity(0.2))
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.red.opacity(0.5), lineWidth: 1)
                            )
                            .padding(.horizontal, 32)
                        }
                        
                        // Sign in with Apple Button
                        SignInWithAppleButtonView(authService: authService)
                            .frame(height: 56)
                            .cornerRadius(16)
                            .shadow(color: Color.black.opacity(0.2), radius: 10, x: 0, y: 5)
                            .padding(.horizontal, 32)
                        
                        // Trust Indicators
                        HStack(spacing: 16) {
                            TrustIndicator(icon: "lock.shield.fill", text: "Secure")
                            TrustIndicator(icon: "eye.slash.fill", text: "Private")
                            TrustIndicator(icon: "checkmark.seal.fill", text: "Verified")
                        }
                        .padding(.top, 8)
                        
                        // Help text
                        Text("Sign in with Apple to access your account. If this is your first time, an account will be created automatically.")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 48)
                            .padding(.top, 8)
                        
                        // Demo Login Button (only in debug)
                        #if DEBUG
                        Button(action: { demoLogin() }) {
                            HStack {
                                Image(systemName: "person.crop.circle.badge.questionmark")
                                Text("Demo Login")
                            }
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.9))
                            .padding(.vertical, 12)
                            .padding(.horizontal, 24)
                            .background(Color.white.opacity(0.15))
                            .cornerRadius(12)
                        }
                        .padding(.top, 16)
                        #endif
                        
                        // Alternative: Create Account option
                        Button(action: { showRegister = true }) {
                            Text("New to Bradley's Finance Hub?")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.9))
                                .underline()
                        }
                        .padding(.top, 8)
                        
                        // iCloud Warning
                        if !authService.isCloudKitAvailable {
                            HStack(spacing: 8) {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .foregroundColor(.orange)
                                Text("iCloud not available. Sign in with Apple ID in Settings to enable sync.")
                                    .font(.caption)
                                    .foregroundColor(.white.opacity(0.8))
                            }
                            .padding()
                            .background(Color.orange.opacity(0.2))
                            .cornerRadius(12)
                            .padding(.horizontal, 32)
                            .padding(.top, 8)
                        }
                    }
                    .padding(.bottom, 40)
                }
            }
        }
        .sheet(isPresented: $showRegister) {
            RegisterView()
        }
    }
    
    private func demoLogin() {
        // Create demo user
        let demoUser = User(
            id: "demo-user-123",
            email: "demo@bradleysfinancehub.com",
            displayName: "Demo User",
            createdAt: Date()
        )
        
        // Authenticate with demo user
        authService.currentUser = demoUser
        authService.isAuthenticated = true
        authService.errorMessage = nil
        
        // Mark that demo data should be loaded
        UserDefaults.standard.set(true, forKey: "shouldLoadDemoData")
    }
}

struct TrustIndicator: View {
    let icon: String
    let text: String
    
    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(.white.opacity(0.9))
            Text(text)
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(.white.opacity(0.8))
        }
    }
}

