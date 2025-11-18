//
//  BiometricAuthView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-16.
//

import SwiftUI

struct BiometricAuthView: View {
    @EnvironmentObject var authService: AuthenticationService
    @State private var isAuthenticating = false
    
    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            
            // Icon
            Image(systemName: iconName)
                .font(.system(size: 80))
                .foregroundColor(.blue)
            
            // Title
            Text("Unlock with \(authService.biometricAuthService.biometricType.displayName)")
                .font(.title2)
                .fontWeight(.semibold)
            
            // Description
            Text("Use \(authService.biometricAuthService.biometricType.displayName) to securely access your financial data")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            // Authenticate Button
            Button(action: authenticate) {
                HStack {
                    if isAuthenticating {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Image(systemName: iconName)
                        Text("Authenticate")
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(isAuthenticating)
            .padding(.horizontal)
            
            // Alternative: Sign Out
            Button("Sign Out") {
                authService.signOut()
            }
            .foregroundColor(.red)
            .padding(.top)
            
            Spacer()
        }
        .task {
            // Auto-trigger biometric on appear
            authenticate()
        }
    }
    
    private var iconName: String {
        switch authService.biometricAuthService.biometricType {
        case .faceID, .opticID:
            return "faceid"
        case .touchID:
            return "touchid"
        case .none:
            return "lock.fill"
        }
    }
    
    private func authenticate() {
        Task {
            isAuthenticating = true
            await authService.authenticateWithBiometric()
            isAuthenticating = false
        }
    }
}

