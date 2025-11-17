//
//  TermsOfServiceView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct TermsOfServiceView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Terms of Service")
                    .font(.title)
                    .fontWeight(.bold)
                
                Text("Last updated: \(Date().formatted(date: .long, time: .omitted))")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text("""
                By using Bradley's Finance Hub, you agree to these terms of service.
                
                This app is provided for personal finance management. We are not responsible for financial decisions made based on information in this app.
                
                Your data is stored locally on your device and synced via iCloud if enabled.
                """)
                .font(.body)
            }
            .padding()
        }
        .navigationTitle("Terms of Service")
    }
}

