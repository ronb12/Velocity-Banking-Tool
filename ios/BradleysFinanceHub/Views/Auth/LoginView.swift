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
        NavigationView {
            VStack(spacing: 32) {
                Text("Bradley's Finance Hub")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .padding(.top, 60)
                
                VStack(spacing: 20) {
                    if let error = authService.errorMessage {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                            .padding(.horizontal)
                    }
                    
                    // Sign in with Apple Button (works for both new and existing users)
                    SignInWithAppleButtonView(authService: authService)
                        .frame(height: 50)
                        .padding(.horizontal)
                    
                    // Help text
                    Text("Sign in with Apple to access your account. If this is your first time, an account will be created automatically.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                    
                    // Alternative: Create Account option
                    Button("New to Bradley's Finance Hub?") {
                        showRegister = true
                    }
                    .font(.caption)
                    .foregroundColor(.blue)
                    .padding(.top, 8)
                    
                    if !authService.isCloudKitAvailable {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.orange)
                            Text("iCloud not available. Sign in with Apple ID in Settings to enable sync.")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .padding(.horizontal)
                    }
                }
                .sheet(isPresented: $showRegister) {
                    RegisterView()
                }
                
                Spacer()
            }
        }
    }
}

