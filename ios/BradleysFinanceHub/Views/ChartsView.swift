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
    @State private var selectedCategory: String?
    
    var categoryTotals: [(String, Double)] {
        let expenses = transactions.filter { $0.type == .expense }
        let grouped = Dictionary(grouping: expenses, by: { $0.category })
        return grouped.map { ($0.key, $0.value.reduce(0) { $0 + $1.amount }) }
            .sorted { $0.1 > $1.1 }
    }
    
    var totalSpending: Double {
        categoryTotals.reduce(0) { $0 + $1.1 }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Spending by Category")
                    .font(.headline)
                Spacer()
                if totalSpending > 0 {
                    Text("Total: $\(String(format: "%.2f", totalSpending))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            if categoryTotals.isEmpty {
                Text("No spending data available")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                ForEach(categoryTotals.prefix(8), id: \.0) { category, amount in
                    Button(action: {
                        selectedCategory = selectedCategory == category ? nil : category
                    }) {
                        HStack(spacing: 12) {
                            // Category name with icon
                            HStack(spacing: 8) {
                                categoryIcon(for: category)
                                Text(category)
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .foregroundColor(.primary)
                            }
                            .frame(width: 120, alignment: .leading)
                            
                            // Progress bar
                            GeometryReader { geometry in
                                ZStack(alignment: .leading) {
                                    Rectangle()
                                        .fill(Color.gray.opacity(0.2))
                                        .frame(height: 24)
                                        .cornerRadius(12)
                                    Rectangle()
                                        .fill(categoryColor(for: category))
                                        .frame(width: geometry.size.width * min(amount / (categoryTotals.first?.1 ?? 1), 1.0), height: 24)
                                        .cornerRadius(12)
                                }
                            }
                            .frame(height: 24)
                            
                            // Amount
                            Text("$\(String(format: "%.2f", amount))")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(.primary)
                                .frame(width: 80, alignment: .trailing)
                            
                            // Percentage
                            Text("\(Int((amount / totalSpending) * 100))%")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .frame(width: 40, alignment: .trailing)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(16)
    }
    
    private func categoryIcon(for category: String) -> some View {
        let iconName: String
        switch category.lowercased() {
        case "groceries", "food": iconName = "cart.fill"
        case "dining out", "restaurant": iconName = "fork.knife"
        case "transportation", "gas": iconName = "car.fill"
        case "entertainment": iconName = "tv.fill"
        case "shopping": iconName = "bag.fill"
        case "utilities": iconName = "bolt.fill"
        case "healthcare", "health": iconName = "cross.case.fill"
        case "bills": iconName = "doc.text.fill"
        default: iconName = "dollarsign.circle.fill"
        }
        return Image(systemName: iconName)
            .foregroundColor(categoryColor(for: category))
            .font(.caption)
    }
    
    private func categoryColor(for category: String) -> Color {
        switch category.lowercased() {
        case "groceries", "food": return .green
        case "dining out", "restaurant": return .orange
        case "transportation", "gas": return .blue
        case "entertainment": return .purple
        case "shopping": return .pink
        case "utilities": return .yellow
        case "healthcare", "health": return .red
        default: return .gray
        }
    }
}

struct MonthlySpendingChart: View {
    let transactions: [Transaction]
    
    var monthlyTotals: [(String, Double)] {
        let expenses = transactions.filter { $0.type == .expense }
        let calendar = Calendar.current
        let grouped = Dictionary(grouping: expenses) { transaction in
            let components = calendar.dateComponents([.year, .month], from: transaction.date)
            return "\(components.year ?? 0)-\(String(format: "%02d", components.month ?? 0))"
        }
        return grouped.map { ($0.key, $0.value.reduce(0) { $0 + $1.amount }) }
            .sorted { $0.0 < $1.0 }
            .map { (formatMonthKey($0.0), $0.1) }
    }
    
    var maxAmount: Double {
        monthlyTotals.map { $0.1 }.max() ?? 1
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Monthly Spending Trend")
                    .font(.headline)
                Spacer()
                if !monthlyTotals.isEmpty {
                    let avg = monthlyTotals.map { $0.1 }.reduce(0, +) / Double(monthlyTotals.count)
                    Text("Avg: $\(String(format: "%.2f", avg))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            if monthlyTotals.isEmpty {
                Text("No spending data available")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                ForEach(monthlyTotals.suffix(6), id: \.0) { month, amount in
                    HStack(spacing: 12) {
                        Text(month)
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .frame(width: 100, alignment: .leading)
                        
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                Rectangle()
                                    .fill(Color.gray.opacity(0.2))
                                    .frame(height: 24)
                                    .cornerRadius(12)
                                Rectangle()
                                    .fill(LinearGradient(
                                        gradient: Gradient(colors: [.blue, .purple]),
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    ))
                                    .frame(width: geometry.size.width * min(amount / maxAmount, 1.0), height: 24)
                                    .cornerRadius(12)
                            }
                        }
                        .frame(height: 24)
                        
                        Text("$\(String(format: "%.2f", amount))")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.primary)
                            .frame(width: 80, alignment: .trailing)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(16)
    }
    
    private func formatMonthKey(_ key: String) -> String {
        let components = key.split(separator: "-")
        if components.count == 2, let year = Int(components[0]), let month = Int(components[1]) {
            let formatter = DateFormatter()
            formatter.dateFormat = "MMM yyyy"
            if let date = Calendar.current.date(from: DateComponents(year: year, month: month)) {
                return formatter.string(from: date)
            }
        }
        return key
    }
}

