//
//  ResetPasswordView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct ResetPasswordView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authService: AuthenticationService
    @State private var email = ""
    @State private var isLoading = false
    @State private var showSuccess = false
    
    var body: some View {
        NavigationView {
            Form {
                Section {
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
						.textInputAutocapitalization(.never)
						.autocorrectionDisabled(true)
                } header: {
                    Text("Enter your email address to receive a password reset link")
                }
                
                if showSuccess {
                    Section {
                        Text("Password reset email sent!")
                            .foregroundColor(.green)
                    }
                }
                
                if let error = authService.errorMessage {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
                
                Section {
                    Button(action: resetPassword) {
                        if isLoading {
                            HStack {
                                Spacer()
                                ProgressView()
                                Spacer()
                            }
                        } else {
                            Text("Send Reset Link")
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .disabled(isLoading || email.isEmpty)
                }
            }
            .navigationTitle("Reset Password")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func resetPassword() {
		isLoading = true
		// Local-only stub: immediately indicate success
		showSuccess = true
		DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
			dismiss()
		}
		isLoading = false
    }
}

