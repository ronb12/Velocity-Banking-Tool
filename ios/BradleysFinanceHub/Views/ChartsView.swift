//
//  ChartsView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct ChartsView: View {
    @EnvironmentObject var dataService: DataService
    @State private var transactions: [Transaction] = []
    @State private var isLoading = true
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    if isLoading {
                        ProgressView()
                    } else {
                        SpendingByCategoryChart(transactions: transactions)
                        MonthlySpendingChart(transactions: transactions)
                    }
                }
                .padding()
            }
            .navigationTitle("Charts")
            .task {
                await loadTransactions()
            }
        }
    }
    
    private func loadTransactions() async {
        do {
            transactions = try await dataService.fetchTransactions()
            isLoading = false
        } catch {
            print("Error loading transactions: \(error)")
            isLoading = false
        }
    }
}

struct SpendingByCategoryChart: View {
    let transactions: [Transaction]
    
    var categoryTotals: [(String, Double)] {
        let expenses = transactions.filter { $0.type == .expense }
        let grouped = Dictionary(grouping: expenses, by: { $0.category })
        return grouped.map { ($0.key, $0.value.reduce(0) { $0 + $1.amount }) }
            .sorted { $0.1 > $1.1 }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Spending by Category")
                .font(.headline)
            
            ForEach(categoryTotals.prefix(5), id: \.0) { category, amount in
                HStack {
                    Text(category)
                        .frame(width: 100, alignment: .leading)
                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            Rectangle()
                                .fill(Color.gray.opacity(0.2))
                                .frame(height: 20)
                            Rectangle()
                                .fill(Color.blue)
                                .frame(width: geometry.size.width * min(amount / (categoryTotals.first?.1 ?? 1), 1.0), height: 20)
                        }
                    }
                    .frame(height: 20)
                    Text("$\(String(format: "%.2f", amount))")
                        .font(.caption)
                        .frame(width: 80, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct MonthlySpendingChart: View {
    let transactions: [Transaction]
    
    var monthlyTotals: [(Int, Double)] {
        let expenses = transactions.filter { $0.type == .expense }
        let grouped = Dictionary(grouping: expenses) { transaction in
            Calendar.current.component(.month, from: transaction.date)
        }
        return grouped.map { ($0.key, $0.value.reduce(0) { $0 + $1.amount }) }
            .sorted { $0.0 < $1.0 }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Monthly Spending")
                .font(.headline)
            
            ForEach(monthlyTotals, id: \.0) { month, amount in
                HStack {
                    Text(monthName(month))
                        .frame(width: 100, alignment: .leading)
                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            Rectangle()
                                .fill(Color.gray.opacity(0.2))
                                .frame(height: 20)
                            Rectangle()
                                .fill(Color.green)
                                .frame(width: geometry.size.width * min(amount / (monthlyTotals.map { $0.1 }.max() ?? 1), 1.0), height: 20)
                        }
                    }
                    .frame(height: 20)
                    Text("$\(String(format: "%.2f", amount))")
                        .font(.caption)
                        .frame(width: 80, alignment: .trailing)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    private func monthName(_ month: Int) -> String {
        let formatter = DateFormatter()
        return formatter.monthSymbols[month - 1]
    }
}

