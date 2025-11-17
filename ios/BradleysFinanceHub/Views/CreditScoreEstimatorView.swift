//
//  CreditScoreEstimatorView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct CreditScoreEstimatorView: View {
    @State private var estimatedScore: Int = 650
    @State private var paymentHistory: Double = 85
    @State private var creditUtilization: Double = 30
    @State private var creditAge: Double = 5
    @State private var creditMix: Double = 70
    
    var body: some View {
        NavigationView {
            Form {
                Section("Credit Factors") {
                    VStack(alignment: .leading) {
                        Text("Payment History: \(Int(paymentHistory))%")
                        Slider(value: $paymentHistory, in: 0...100)
                    }
                    
                    VStack(alignment: .leading) {
                        Text("Credit Utilization: \(Int(creditUtilization))%")
                        Slider(value: $creditUtilization, in: 0...100)
                    }
                    
                    VStack(alignment: .leading) {
                        Text("Credit Age: \(Int(creditAge)) years")
                        Slider(value: $creditAge, in: 0...20)
                    }
                    
                    VStack(alignment: .leading) {
                        Text("Credit Mix: \(Int(creditMix))%")
                        Slider(value: $creditMix, in: 0...100)
                    }
                }
                
                Section("Estimated Score") {
                    HStack {
                        Text("Score")
                        Spacer()
                        Text("\(estimatedScore)")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(scoreColor(estimatedScore))
                    }
                    
                    Text(scoreDescription(estimatedScore))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .navigationTitle("Credit Score Estimator")
            .onChange(of: paymentHistory) { _ in calculateScore() }
            .onChange(of: creditUtilization) { _ in calculateScore() }
            .onChange(of: creditAge) { _ in calculateScore() }
            .onChange(of: creditMix) { _ in calculateScore() }
        }
    }
    
    private func calculateScore() {
        let baseScore = 300
        let paymentWeight = paymentHistory * 0.35
        let utilizationWeight = (100 - creditUtilization) * 0.30
        let ageWeight = creditAge * 5 * 0.15
        let mixWeight = creditMix * 0.20
        
        estimatedScore = baseScore + Int(paymentWeight + utilizationWeight + ageWeight + mixWeight)
        estimatedScore = min(max(estimatedScore, 300), 850)
    }
    
    private func scoreColor(_ score: Int) -> Color {
        switch score {
        case 750...850: return .green
        case 700..<750: return .blue
        case 650..<700: return .orange
        default: return .red
        }
    }
    
    private func scoreDescription(_ score: Int) -> String {
        switch score {
        case 750...850: return "Excellent"
        case 700..<750: return "Good"
        case 650..<700: return "Fair"
        default: return "Poor"
        }
    }
}

