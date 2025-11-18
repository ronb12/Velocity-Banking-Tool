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
    @State private var showingAddTransaction = false
    @State private var showingAddBudget = false
    @State private var showingAddGoal = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    if isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else {
                        // Net Worth Card (like Mint/Personal Capital) - Larger, more prominent
                        NetWorthCard(transactions: transactions, debts: debts, savingsGoals: savingsGoals)
                        
                        // Quick Action Buttons
                        QuickActionButtons(
                            onAddTransaction: { showingAddTransaction = true },
                            onAddBudget: { showingAddBudget = true },
                            onAddGoal: { showingAddGoal = true }
                        )
                        
                        // Quick Summary Cards
                        SummaryCardsView(
                            transactions: transactions,
                            budgets: budgets,
                            debts: debts,
                            savingsGoals: savingsGoals
                        )
                        
                        // Budget Overview (like YNAB)
                        BudgetOverviewSection(budgets: budgets)
                        
                        // Recent Transactions
                        RecentTransactionsSection(transactions: transactions)
                        
                        // Savings Goals Progress
                        SavingsGoalsSection(savingsGoals: savingsGoals)
                    }
                }
                .padding()
            }
            .navigationTitle("Dashboard")
            .refreshable {
                await loadData()
            }
            .task {
                await loadData()
            }
            .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("DemoDataLoaded"))) { _ in
                Task {
                    print("DashboardView: Refreshing after demo data load...")
                    await loadData()
                }
            }
            .sheet(isPresented: $showingAddTransaction) {
                AddTransactionView(dataService: dataService)
                    .onDisappear {
                        Task {
                            await loadData()
                        }
                    }
            }
            .sheet(isPresented: $showingAddBudget) {
                AddBudgetView(dataService: dataService)
                    .onDisappear {
                        Task {
                            await loadData()
                        }
                    }
            }
            .sheet(isPresented: $showingAddGoal) {
                AddSavingsGoalView(dataService: dataService)
                    .onDisappear {
                        Task {
                            await loadData()
                        }
                    }
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

// MARK: - Enhanced Dashboard Components

struct NetWorthCard: View {
    let transactions: [Transaction]
    let debts: [Debt]
    let savingsGoals: [SavingsGoal]
    
    var totalAssets: Double {
        let income = transactions.filter { $0.type == .income }.reduce(0) { $0 + $1.amount }
        let expenses = transactions.filter { $0.type == .expense }.reduce(0) { $0 + $1.amount }
        let savings = savingsGoals.reduce(0) { $0 + $1.currentAmount }
        return income - expenses + savings
    }
    
    var totalLiabilities: Double {
        debts.reduce(0) { $0 + $1.balance }
    }
    
    var netWorth: Double {
        totalAssets - totalLiabilities
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Net Worth")
                .font(.headline)
                .foregroundColor(.secondary)
            
            Text("$\(String(format: "%.2f", netWorth))")
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(netWorth >= 0 ? .green : .red)
            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Assets")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("$\(String(format: "%.2f", totalAssets))")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.green)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Liabilities")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("$\(String(format: "%.2f", totalLiabilities))")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.red)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(
            LinearGradient(
                gradient: Gradient(colors: [Color.blue.opacity(0.1), Color.purple.opacity(0.1)]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(16)
    }
}

struct BudgetOverviewSection: View {
    let budgets: [Budget]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Budget Overview")
                .font(.headline)
                .padding(.horizontal)
            
            if budgets.isEmpty {
                Text("No budgets set up yet")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding()
            } else {
                ForEach(budgets.prefix(3)) { budget in
                    BudgetProgressRow(budget: budget)
                }
            }
        }
    }
}

struct BudgetProgressRow: View {
    let budget: Budget
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(budget.category)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Spacer()
                Text("$\(String(format: "%.2f", budget.spentAmount)) / $\(String(format: "%.2f", budget.budgetedAmount))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color(.systemGray5))
                        .frame(height: 8)
                        .cornerRadius(4)
                    
                    Rectangle()
                        .fill(budget.percentage > 100 ? Color.red : (budget.percentage > 80 ? Color.orange : Color.green))
                        .frame(width: geometry.size.width * min(budget.percentage / 100, 1.0), height: 8)
                        .cornerRadius(4)
                }
            }
            .frame(height: 8)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct RecentTransactionsSection: View {
    let transactions: [Transaction]
    
    var recentTransactions: [Transaction] {
        Array(transactions.sorted { $0.date > $1.date }.prefix(5))
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Transactions")
                .font(.headline)
                .padding(.horizontal)
            
            if recentTransactions.isEmpty {
                Text("No transactions yet")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding()
            } else {
                ForEach(recentTransactions) { transaction in
                    TransactionRow(transaction: transaction)
                }
            }
        }
    }
}

struct TransactionRow: View {
    let transaction: Transaction
    
    var body: some View {
        HStack {
            Image(systemName: transaction.type == .income ? "arrow.down.circle.fill" : "arrow.up.circle.fill")
                .foregroundColor(transaction.type == .income ? .green : .red)
                .font(.title3)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(transaction.description)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text(transaction.category)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text("\(transaction.type == .income ? "+" : "-")$\(String(format: "%.2f", transaction.amount))")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(transaction.type == .income ? .green : .red)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct SavingsGoalsSection: View {
    let savingsGoals: [SavingsGoal]
    
    var activeGoals: [SavingsGoal] {
        Array(savingsGoals.filter { !$0.isCompleted }.prefix(3))
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Savings Goals")
                .font(.headline)
                .padding(.horizontal)
            
            if activeGoals.isEmpty {
                Text("No active savings goals")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding()
            } else {
                ForEach(activeGoals) { goal in
                    SavingsGoalRow(goal: goal)
                }
            }
        }
    }
}

struct SavingsGoalRow: View {
    let goal: SavingsGoal
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(goal.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Spacer()
                Text("\(Int(goal.percentage))%")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.blue)
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color(.systemGray5))
                        .frame(height: 8)
                        .cornerRadius(4)
                    
                    Rectangle()
                        .fill(Color.blue)
                        .frame(width: geometry.size.width * (goal.percentage / 100), height: 8)
                        .cornerRadius(4)
                }
            }
            .frame(height: 8)
            
            HStack {
                Text("$\(String(format: "%.2f", goal.currentAmount))")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text("of")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text("$\(String(format: "%.2f", goal.targetAmount))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Quick Action Buttons

struct QuickActionButtons: View {
    let onAddTransaction: () -> Void
    let onAddBudget: () -> Void
    let onAddGoal: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            QuickActionButton(
                title: "Add Transaction",
                icon: "plus.circle.fill",
                color: .blue,
                action: onAddTransaction
            )
            
            QuickActionButton(
                title: "Add Budget",
                icon: "dollarsign.circle.fill",
                color: .green,
                action: onAddBudget
            )
            
            QuickActionButton(
                title: "Add Goal",
                icon: "target",
                color: .purple,
                action: onAddGoal
            )
        }
        .padding(.horizontal)
    }
}

struct QuickActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
    }
}

