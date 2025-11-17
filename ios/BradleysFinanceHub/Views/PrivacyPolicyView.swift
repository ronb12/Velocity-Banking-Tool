//
//  PrivacyPolicyView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct PrivacyPolicyView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Privacy Policy")
                    .font(.title)
                    .fontWeight(.bold)
                
                Text("Last updated: \(Date().formatted(date: .long, time: .omitted))")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text("""
                Bradley's Finance Hub respects your privacy.
                
                All financial data is stored locally on your device. If iCloud is enabled, data is synced securely through Apple's iCloud service.
                
                We do not collect, share, or sell your personal information.
                
                Biometric authentication is handled locally and never transmitted.
                """)
                .font(.body)
            }
            .padding()
        }
        .navigationTitle("Privacy Policy")
    }
}

