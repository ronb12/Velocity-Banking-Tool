//
//  DashboardView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var dataService: DataService
    @State private var transactions: [Transaction] = []
    @State private var budgets: [Budget] = []
    @State private var debts: [Debt] = []
    @State private var savingsGoals: [SavingsGoal] = []
    @State private var isLoading = true
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    if isLoading {
                        ProgressView()
                    } else {
                        SummaryCardsView(
                            transactions: transactions,
                            budgets: budgets,
                            debts: debts,
                            savingsGoals: savingsGoals
                        )
                    }
                }
                .padding()
            }
            .navigationTitle("Dashboard")
            .task {
                await loadData()
            }
        }
    }
    
    private func loadData() async {
        do {
            async let t = dataService.fetchTransactions()
            async let b = dataService.fetchBudgets()
            async let d = dataService.fetchDebts()
            async let s = dataService.fetchSavingsGoals()
            
            transactions = try await t
            budgets = try await b
            debts = try await d
            savingsGoals = try await s
            isLoading = false
        } catch {
            print("Error loading data: \(error)")
            isLoading = false
        }
    }
}

struct SummaryCardsView: View {
    let transactions: [Transaction]
    let budgets: [Budget]
    let debts: [Debt]
    let savingsGoals: [SavingsGoal]
    
    var totalIncome: Double {
        transactions.filter { $0.type == .income }.reduce(0) { $0 + $1.amount }
    }
    
    var totalExpenses: Double {
        transactions.filter { $0.type == .expense }.reduce(0) { $0 + $1.amount }
    }
    
    var totalDebt: Double {
        debts.reduce(0) { $0 + $1.balance }
    }
    
    var totalSavings: Double {
        savingsGoals.reduce(0) { $0 + $1.currentAmount }
    }
    
    var body: some View {
        VStack(spacing: 16) {
            HStack(spacing: 16) {
                SummaryCard(title: "Income", value: totalIncome, color: .green)
                SummaryCard(title: "Expenses", value: totalExpenses, color: .red)
            }
            
            HStack(spacing: 16) {
                SummaryCard(title: "Debt", value: totalDebt, color: .orange)
                SummaryCard(title: "Savings", value: totalSavings, color: .blue)
            }
            
            SummaryCard(title: "Net", value: totalIncome - totalExpenses, color: totalIncome - totalExpenses >= 0 ? .green : .red)
        }
    }
}

struct SummaryCard: View {
    let title: String
    let value: Double
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            Text("$\(String(format: "%.2f", value))")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

