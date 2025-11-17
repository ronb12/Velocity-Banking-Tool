//
//  SignInWithAppleButtonView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-16.
//

import SwiftUI
import AuthenticationServices

struct SignInWithAppleButtonView: UIViewRepresentable {
    let authService: AuthenticationService
    
    func makeUIView(context: Context) -> ASAuthorizationAppleIDButton {
        let button = ASAuthorizationAppleIDButton(type: .signIn, style: .black)
        button.addTarget(context.coordinator, action: #selector(Coordinator.handleAuthorization), for: .touchUpInside)
        return button
    }
    
    func updateUIView(_ uiView: ASAuthorizationAppleIDButton, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(authService: authService)
    }
    
    class Coordinator: NSObject {
        let authService: AuthenticationService
        
        init(authService: AuthenticationService) {
            self.authService = authService
        }
        
        @objc func handleAuthorization() {
            authService.signInWithApple()
        }
    }
}

