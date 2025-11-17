//
//  InsightsView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct InsightsView: View {
    @EnvironmentObject var dataService: DataService
    @State private var transactions: [Transaction] = []
    @State private var goals: [SavingsGoal] = []
    @State private var insights: [String] = []
    
    var body: some View {
        NavigationView {
            List {
                ForEach(insights, id: \.self) { insight in
                    HStack {
                        Image(systemName: "lightbulb.fill")
                            .foregroundColor(.yellow)
                        Text(insight)
                    }
                }
            }
            .navigationTitle("Insights")
            .task {
                await loadData()
            }
        }
    }
    
    private func loadData() async {
        do {
            async let t = dataService.fetchTransactions()
            async let g = dataService.fetchSavingsGoals()
            transactions = try await t
            goals = try await g
            
            let insightsService = InsightsService()
            insights = insightsService.getSpendingInsights(transactions: transactions) +
                       insightsService.getSavingsInsights(goals: goals)
        } catch {
            print("Error loading data: \(error)")
        }
    }
}

