//
//  ChallengeLibraryView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct ChallengeLibraryView: View {
    let challenges = [
        Challenge(name: "52 Week Challenge", description: "Save $1 the first week, $2 the second, and so on", target: 1378),
        Challenge(name: "No Spend Challenge", description: "30 days of no unnecessary spending", target: 0),
        Challenge(name: "Emergency Fund", description: "Build a 6-month emergency fund", target: 0),
        Challenge(name: "Holiday Savings", description: "Save for holiday expenses", target: 0)
    ]
    
    var body: some View {
        NavigationView {
            List {
                ForEach(challenges) { challenge in
                    ChallengeRowView(challenge: challenge)
                }
            }
            .navigationTitle("Savings Challenges")
        }
    }
}

struct Challenge: Identifiable {
    let id = UUID()
    let name: String
    let description: String
    let target: Double
}

struct ChallengeRowView: View {
    let challenge: Challenge
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(challenge.name)
                .font(.headline)
            Text(challenge.description)
                .font(.subheadline)
                .foregroundColor(.secondary)
            if challenge.target > 0 {
                Text("Target: $\(String(format: "%.2f", challenge.target))")
                    .font(.caption)
                    .foregroundColor(.blue)
            }
        }
        .padding(.vertical, 4)
    }
}

