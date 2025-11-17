//
//  SmokeTestView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct SmokeTestView: View {
    @EnvironmentObject var dataService: DataService
    @State private var testResults: [String] = []
    
    var body: some View {
        NavigationView {
            List {
                ForEach(testResults, id: \.self) { result in
                    Text(result)
                }
            }
            .navigationTitle("Smoke Test")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Run Tests") {
                        runTests()
                    }
                }
            }
        }
    }
    
    private func runTests() {
        testResults = []
        testResults.append("Testing data service...")
        
        Task {
            do {
                let transactions = try await dataService.fetchTransactions()
                testResults.append("✓ Transactions loaded: \(transactions.count)")
                
                let budgets = try await dataService.fetchBudgets()
                testResults.append("✓ Budgets loaded: \(budgets.count)")
                
                let debts = try await dataService.fetchDebts()
                testResults.append("✓ Debts loaded: \(debts.count)")
                
                testResults.append("✓ All tests passed")
            } catch {
                testResults.append("✗ Error: \(error.localizedDescription)")
            }
        }
    }
}

