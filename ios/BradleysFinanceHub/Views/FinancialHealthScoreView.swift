//
//  FinancialHealthScoreView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct FinancialHealthScoreView: View {
    @EnvironmentObject var dataService: DataService
    @State private var debts: [Debt] = []
    @State private var savings: [SavingsGoal] = []
    @State private var netWorth: Double = 0
    @State private var healthScore: Int = 0
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                VStack(spacing: 16) {
                    Text("Financial Health Score")
                        .font(.title)
                        .fontWeight(.bold)
                    
                    Text("\(healthScore)")
                        .font(.system(size: 72, weight: .bold))
                        .foregroundColor(scoreColor(healthScore))
                    
                    Text(scoreStatus(healthScore))
                        .font(.title2)
                        .foregroundColor(.secondary)
                }
                .padding()
                
                Spacer()
            }
            .navigationTitle("Health Score")
            .task {
                await loadData()
            }
        }
    }
    
    private func loadData() async {
        do {
            async let d = dataService.fetchDebts()
            async let s = dataService.fetchSavingsGoals()
            async let nw = dataService.fetchNetWorthHistory()
            debts = try await d
            savings = try await s
            let netWorthHistory = try await nw
            
            if let latest = netWorthHistory.first {
                netWorth = latest.assets - latest.liabilities
            }
            
            let healthService = FinancialHealthService()
            healthScore = healthService.calculateHealthScore(
                debts: debts,
                savings: savings,
                netWorth: netWorth
            )
        } catch {
            print("Error loading data: \(error)")
        }
    }
    
    private func scoreColor(_ score: Int) -> Color {
        switch score {
        case 80...100: return .green
        case 60..<80: return .blue
        case 40..<60: return .orange
        default: return .red
        }
    }
    
    private func scoreStatus(_ score: Int) -> String {
        switch score {
        case 80...100: return "Excellent"
        case 60..<80: return "Good"
        case 40..<60: return "Fair"
        default: return "Needs Improvement"
        }
    }
}

