//
//  ReportsView.swift
//  BradleysFinanceHub
//
//  Professional financial reports with charts and visualizations
//

import SwiftUI
import Charts

struct ReportsView: View {
    @EnvironmentObject var dataService: DataService
    @State private var transactions: [Transaction] = []
    @State private var budgets: [Budget] = []
    @State private var selectedMonth = Date()
    @State private var isLoading = true
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Month Selector
                    MonthSelectorCard(selectedMonth: $selectedMonth)
                    
                    if isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity, minHeight: 200)
                    } else {
                        // Summary Cards
                        ReportsSummaryCardsView(
                            transactions: transactions,
                            budgets: budgets,
                            month: selectedMonth
                        )
                        
                        // Income vs Expenses Chart
                        IncomeExpensesChartCard(
                            transactions: transactions,
                            month: selectedMonth
                        )
                        
                        // Budget Performance
                        BudgetPerformanceCard(budgets: budgets)
                        
                        // Category Breakdown
                        CategoryBreakdownCard(
                            transactions: transactions,
                            month: selectedMonth
                        )
                        
                        // Top Expenses
                        TopExpensesCard(
                            transactions: transactions,
                            month: selectedMonth
                        )
                    }
                }
                .padding()
            }
            .navigationTitle("Financial Reports")
            .task {
                await loadData()
            }
            .onChange(of: selectedMonth) { oldValue, newValue in
                Task {
                    await loadData()
                }
            }
        }
    }
    
    private func loadData() async {
        isLoading = true
        do {
            async let t = dataService.fetchTransactions()
            async let b = dataService.fetchBudgets()
            transactions = try await t
            budgets = try await b
            isLoading = false
        } catch {
            print("Error loading data: \(error)")
            isLoading = false
        }
    }
}

// MARK: - Month Selector Card

struct MonthSelectorCard: View {
    @Binding var selectedMonth: Date
    
    var body: some View {
        HStack {
            Button(action: { changeMonth(-1) }) {
                Image(systemName: "chevron.left")
                    .font(.title3)
                    .foregroundColor(.blue)
            }
            
            Spacer()
            
            VStack(spacing: 4) {
                Text(selectedMonth, format: .dateTime.month(.wide).year())
                    .font(.headline)
                Text("Financial Report")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Button(action: { changeMonth(1) }) {
                Image(systemName: "chevron.right")
                    .font(.title3)
                    .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(16)
    }
    
    private func changeMonth(_ direction: Int) {
        if let newDate = Calendar.current.date(byAdding: .month, value: direction, to: selectedMonth) {
            selectedMonth = newDate
        }
    }
}

// MARK: - Summary Cards

struct ReportsSummaryCardsView: View {
    let transactions: [Transaction]
    let budgets: [Budget]
    let month: Date
    
    var monthlyData: (income: Double, expenses: Double, net: Double) {
        let calendar = Calendar.current
        guard let startOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: month)),
              let endOfMonth = calendar.date(byAdding: .month, value: 1, to: startOfMonth) else {
            return (0, 0, 0)
        }
        
        let monthlyTransactions = transactions.filter { $0.date >= startOfMonth && $0.date < endOfMonth }
        let income = monthlyTransactions.filter { $0.type == .income }.reduce(0) { $0 + $1.amount }
        let expenses = monthlyTransactions.filter { $0.type == .expense }.reduce(0) { $0 + $1.amount }
        let net = income - expenses
        
        return (income, expenses, net)
    }
    
    var body: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                ReportsSummaryCard(
                    title: "Income",
                    amount: monthlyData.income,
                    icon: "arrow.down.circle.fill",
                    color: .green
                )
                
                ReportsSummaryCard(
                    title: "Expenses",
                    amount: monthlyData.expenses,
                    icon: "arrow.up.circle.fill",
                    color: .red
                )
            }
            
            ReportsSummaryCard(
                title: "Net Income",
                amount: monthlyData.net,
                icon: "dollarsign.circle.fill",
                color: monthlyData.net >= 0 ? .blue : .orange
            )
        }
    }
}

struct ReportsSummaryCard: View {
    let title: String
    let amount: Double
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.title3)
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text("$\(String(format: "%.2f", amount))")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(color)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

// MARK: - Income vs Expenses Chart

struct IncomeExpensesChartCard: View {
    let transactions: [Transaction]
    let month: Date
    
    var weeklyData: [(week: Int, income: Double, expenses: Double)] {
        let calendar = Calendar.current
        guard let startOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: month)),
              let endOfMonth = calendar.date(byAdding: .month, value: 1, to: startOfMonth) else {
            return []
        }
        
        let monthlyTransactions = transactions.filter { $0.date >= startOfMonth && $0.date < endOfMonth }
        var weeklyData: [(week: Int, income: Double, expenses: Double)] = []
        
        for week in 1...4 {
            let weekStart = calendar.date(byAdding: .day, value: (week - 1) * 7, to: startOfMonth) ?? startOfMonth
            let weekEnd = calendar.date(byAdding: .day, value: week * 7, to: startOfMonth) ?? endOfMonth
            
            let weekTransactions = monthlyTransactions.filter { $0.date >= weekStart && $0.date < weekEnd }
            let income = weekTransactions.filter { $0.type == .income }.reduce(0) { $0 + $1.amount }
            let expenses = weekTransactions.filter { $0.type == .expense }.reduce(0) { $0 + $1.amount }
            
            weeklyData.append((week, income, expenses))
        }
        
        return weeklyData
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Income vs Expenses")
                .font(.headline)
            
            if #available(iOS 16.0, *) {
                Chart {
                    ForEach(weeklyData, id: \.week) { data in
                        BarMark(
                            x: .value("Week", "Week \(data.week)"),
                            y: .value("Income", data.income)
                        )
                        .foregroundStyle(Color.green)
                        .cornerRadius(4)
                        
                        BarMark(
                            x: .value("Week", "Week \(data.week)"),
                            y: .value("Expenses", data.expenses)
                        )
                        .foregroundStyle(Color.red)
                        .cornerRadius(4)
                    }
                }
                .frame(height: 200)
            } else {
                // Fallback for iOS 15
                VStack(spacing: 8) {
                    ForEach(weeklyData, id: \.week) { data in
                        HStack {
                            Text("Week \(data.week)")
                                .font(.caption)
                                .frame(width: 60, alignment: .leading)
                            
                            GeometryReader { geometry in
                                HStack(spacing: 0) {
                                    Rectangle()
                                        .fill(Color.green)
                                        .frame(width: geometry.size.width * 0.4)
                                    Rectangle()
                                        .fill(Color.red)
                                        .frame(width: geometry.size.width * 0.4)
                                }
                            }
                            .frame(height: 20)
                            
                            Spacer()
                        }
                    }
                }
                .frame(height: 200)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

// MARK: - Budget Performance

struct BudgetPerformanceCard: View {
    let budgets: [Budget]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Budget Performance")
                .font(.headline)
            
            if budgets.isEmpty {
                Text("No budgets set for this month")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                ForEach(budgets.prefix(5)) { budget in
                    BudgetPerformanceRow(budget: budget)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

struct BudgetPerformanceRow: View {
    let budget: Budget
    
    var percentage: Double {
        guard budget.budgetedAmount > 0 else { return 0 }
        return min(budget.spentAmount / budget.budgetedAmount, 1.0)
    }
    
    var isOverBudget: Bool {
        budget.spentAmount > budget.budgetedAmount
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(budget.category)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Spacer()
                Text("\(Int(percentage * 100))%")
                    .font(.caption)
                    .foregroundColor(isOverBudget ? .red : .secondary)
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 8)
                        .cornerRadius(4)
                    
                    Rectangle()
                        .fill(isOverBudget ? Color.red : Color.green)
                        .frame(width: geometry.size.width * percentage, height: 8)
                        .cornerRadius(4)
                }
            }
            .frame(height: 8)
            
            HStack {
                Text("$\(String(format: "%.2f", budget.spentAmount))")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text("of")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text("$\(String(format: "%.2f", budget.budgetedAmount))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Category Breakdown

struct CategoryBreakdownCard: View {
    let transactions: [Transaction]
    let month: Date
    
    var categoryData: [(category: String, amount: Double)] {
        let calendar = Calendar.current
        guard let startOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: month)),
              let endOfMonth = calendar.date(byAdding: .month, value: 1, to: startOfMonth) else {
            return []
        }
        
        let monthlyTransactions = transactions.filter { $0.date >= startOfMonth && $0.date < endOfMonth && $0.type == .expense }
        var categoryDict: [String: Double] = [:]
        
        for transaction in monthlyTransactions {
            categoryDict[transaction.category, default: 0] += transaction.amount
        }
        
        return categoryDict.map { (category: $0.key, amount: $0.value) }
            .sorted { $0.amount > $1.amount }
            .prefix(6)
            .map { $0 }
    }
    
    var totalExpenses: Double {
        categoryData.reduce(0) { $0 + $1.amount }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Category Breakdown")
                .font(.headline)
            
            if categoryData.isEmpty {
                Text("No expense data for this month")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                ForEach(categoryData, id: \.category) { data in
                    CategoryRow(
                        category: data.category,
                        amount: data.amount,
                        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) : 0
                    )
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

struct CategoryRow: View {
    let category: String
    let amount: Double
    let percentage: Double
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(category)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text("\(Int(percentage * 100))%")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text("$\(String(format: "%.2f", amount))")
                .font(.subheadline)
                .fontWeight(.semibold)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Top Expenses

struct TopExpensesCard: View {
    let transactions: [Transaction]
    let month: Date
    
    var topExpenses: [Transaction] {
        let calendar = Calendar.current
        guard let startOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: month)),
              let endOfMonth = calendar.date(byAdding: .month, value: 1, to: startOfMonth) else {
            return []
        }
        
        return transactions
            .filter { $0.date >= startOfMonth && $0.date < endOfMonth && $0.type == .expense }
            .sorted { $0.amount > $1.amount }
            .prefix(5)
            .map { $0 }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Top Expenses")
                .font(.headline)
            
            if topExpenses.isEmpty {
                Text("No expenses for this month")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                ForEach(topExpenses) { transaction in
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(transaction.description)
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text(transaction.category)
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(transaction.date, format: .dateTime.month().day())
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        Text("$\(String(format: "%.2f", transaction.amount))")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.red)
                    }
                    .padding(.vertical, 4)
                    
                    if transaction.id != topExpenses.last?.id {
                        Divider()
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}
