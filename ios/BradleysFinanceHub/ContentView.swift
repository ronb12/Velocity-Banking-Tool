//
//  ContentView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authService: AuthenticationService
    @State private var showBiometricPrompt = false
    
    var body: some View {
        Group {
            if authService.isAuthenticated {
                MainTabView()
            } else if authService.requiresBiometricAuth {
                BiometricAuthView()
                    .environmentObject(authService)
            } else {
                LoginView()
            }
        }
        .task {
            // Check if biometric auth is needed on app launch
            if authService.requiresBiometricAuth {
                await authService.authenticateWithBiometric()
            }
        }
    }
}

