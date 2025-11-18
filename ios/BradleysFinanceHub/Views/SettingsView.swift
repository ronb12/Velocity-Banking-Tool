//
//  SettingsView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var dataService: DataService
    @EnvironmentObject var themeManager: ThemeManager
    @EnvironmentObject var authService: AuthenticationService
    @State private var showingExport = false
    @State private var showingImport = false
    @State private var isLoadingDemoData = false
    @State private var demoDataMessage: String?
    
    var body: some View {
        NavigationView {
            Form {
                Section("Appearance") {
                    Picker("Theme", selection: $themeManager.currentTheme) {
                        ForEach(AppTheme.allCases, id: \.self) { theme in
                            Text(theme.displayName).tag(theme)
                        }
                    }
                    .onChange(of: themeManager.currentTheme) {
                        themeManager.setTheme(themeManager.currentTheme)
                    }
                }
                
                Section("Data") {
                    if let message = demoDataMessage {
                        Text(message)
                            .foregroundColor(.secondary)
                            .font(.caption)
                    }
                    Button("Load Demo Data") {
                        loadDemoData()
                    }
                    .disabled(isLoadingDemoData)
                    if isLoadingDemoData {
                        ProgressView()
                    }
                    Button("Export Data") {
                        showingExport = true
                    }
                    Button("Import Data") {
                        showingImport = true
                    }
                }
                
                Section("Notifications") {
                    NavigationLink(destination: NotificationsView()) {
                        HStack {
                            Image(systemName: "bell.fill")
                            Text("Notification Settings")
                        }
                    }
                }
                
                Section("Account") {
                    HStack {
                        Image(systemName: "person.circle.fill")
                        Text("Email")
                        Spacer()
                        Text(authService.currentUser?.email ?? "Not signed in")
                            .foregroundColor(.secondary)
                    }
                    Button(role: .destructive) {
                        logout()
                    } label: {
                        HStack {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                            Text("Log Out")
                        }
                    }
                }
                
                Section("Legal") {
                    NavigationLink(destination: PrivacyPolicyView()) {
                        HStack {
                            Image(systemName: "hand.raised.fill")
                            Text("Privacy Policy")
                        }
                    }
                    NavigationLink(destination: TermsOfServiceView()) {
                        HStack {
                            Image(systemName: "doc.text.fill")
                            Text("Terms of Service")
                        }
                    }
                }
                
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .sheet(isPresented: $showingExport) {
                DataExportView(dataService: dataService)
            }
            .sheet(isPresented: $showingImport) {
                DataImportView()
            }
        }
    }
    
    private func loadDemoData() {
        isLoadingDemoData = true
        demoDataMessage = nil
        
        Task {
            do {
                try await generateAllDemoData()
                await MainActor.run {
                    isLoadingDemoData = false
                    demoDataMessage = "✅ Demo data loaded successfully!"
                }
            } catch {
                await MainActor.run {
                    isLoadingDemoData = false
                    demoDataMessage = "❌ Error: \(error.localizedDescription)"
                }
            }
        }
    }
    
    // MARK: - Demo Data Generation
    
    private func generateAllDemoData() async throws {
        print("🎭 Starting demo data generation...")
        
        let calendar = Calendar.current
        let now = Date()
        let currentMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: now)) ?? now
        
        // Generate Budgets
        let budgets = [
            Budget(category: "Groceries", budgetedAmount: 600.00, spentAmount: 485.30, month: currentMonth),
            Budget(category: "Dining Out", budgetedAmount: 300.00, spentAmount: 287.50, month: currentMonth),
            Budget(category: "Transportation", budgetedAmount: 400.00, spentAmount: 320.00, month: currentMonth),
            Budget(category: "Entertainment", budgetedAmount: 200.00, spentAmount: 145.00, month: currentMonth),
            Budget(category: "Shopping", budgetedAmount: 500.00, spentAmount: 520.00, month: currentMonth),
            Budget(category: "Utilities", budgetedAmount: 250.00, spentAmount: 235.00, month: currentMonth),
            Budget(category: "Healthcare", budgetedAmount: 300.00, spentAmount: 180.00, month: currentMonth)
        ]
        
        for budget in budgets {
            try await dataService.saveBudget(budget)
        }
        
        // Generate Debts
        let debts = [
            Debt(name: "Credit Card - Chase", balance: 2340.75, interestRate: 18.99, minimumPayment: 75.00, dueDate: calendar.date(byAdding: .day, value: 15, to: now)),
            Debt(name: "Student Loan", balance: 12500.00, interestRate: 4.5, minimumPayment: 250.00, dueDate: calendar.date(byAdding: .day, value: 5, to: now)),
            Debt(name: "Car Loan", balance: 8500.00, interestRate: 3.9, minimumPayment: 320.00, dueDate: calendar.date(byAdding: .day, value: 20, to: now)),
            Debt(name: "Personal Loan", balance: 3200.00, interestRate: 12.5, minimumPayment: 150.00, dueDate: calendar.date(byAdding: .day, value: 10, to: now))
        ]
        
        for debt in debts {
            try await dataService.saveDebt(debt)
        }
        
        // Generate Savings Goals
        let goals = [
            SavingsGoal(name: "Emergency Fund", targetAmount: 10000.00, currentAmount: 8000.00, targetDate: calendar.date(byAdding: .month, value: 3, to: now), priority: 1),
            SavingsGoal(name: "Vacation to Europe", targetAmount: 5000.00, currentAmount: 3200.00, targetDate: calendar.date(byAdding: .month, value: 6, to: now), priority: 2),
            SavingsGoal(name: "New Laptop", targetAmount: 2000.00, currentAmount: 850.00, targetDate: calendar.date(byAdding: .month, value: 2, to: now), priority: 3),
            SavingsGoal(name: "Down Payment for House", targetAmount: 50000.00, currentAmount: 12500.00, targetDate: calendar.date(byAdding: .year, value: 2, to: now), priority: 1),
            SavingsGoal(name: "Wedding Fund", targetAmount: 15000.00, currentAmount: 5200.00, targetDate: calendar.date(byAdding: .year, value: 1, to: now), priority: 2)
        ]
        
        for goal in goals {
            try await dataService.saveSavingsGoal(goal)
        }
        
        // Generate Transactions
        let groceriesBudget = budgets.first { $0.category == "Groceries" }
        let diningBudget = budgets.first { $0.category == "Dining Out" }
        let transportBudget = budgets.first { $0.category == "Transportation" }
        let entertainmentBudget = budgets.first { $0.category == "Entertainment" }
        let shoppingBudget = budgets.first { $0.category == "Shopping" }
        
        // Income transactions
        for monthOffset in 0..<3 {
            let monthDate = calendar.date(byAdding: .month, value: -monthOffset, to: now) ?? now
            let payday1 = calendar.date(byAdding: .day, value: 1, to: monthDate) ?? monthDate
            let payday2 = calendar.date(byAdding: .day, value: 15, to: monthDate) ?? monthDate
            
            try await dataService.saveTransaction(Transaction(amount: 3500.00, category: "Salary", date: payday1, description: "Monthly Salary", type: .income, createdAt: payday1))
            try await dataService.saveTransaction(Transaction(amount: 3500.00, category: "Salary", date: payday2, description: "Monthly Salary", type: .income, createdAt: payday2))
        }
        
        // Expense transactions
        let expenses = [
            ("Groceries", 45.99, groceriesBudget?.id), ("Groceries", 78.50, groceriesBudget?.id),
            ("Groceries", 32.25, groceriesBudget?.id), ("Groceries", 95.00, groceriesBudget?.id),
            ("Dining Out", 28.50, diningBudget?.id), ("Dining Out", 45.00, diningBudget?.id),
            ("Dining Out", 67.30, diningBudget?.id), ("Dining Out", 22.00, diningBudget?.id),
            ("Transportation", 45.00, transportBudget?.id), ("Transportation", 60.00, transportBudget?.id),
            ("Transportation", 35.00, transportBudget?.id), ("Entertainment", 15.99, entertainmentBudget?.id),
            ("Entertainment", 45.00, entertainmentBudget?.id), ("Entertainment", 28.50, entertainmentBudget?.id),
            ("Shopping", 89.99, shoppingBudget?.id), ("Shopping", 125.00, shoppingBudget?.id),
            ("Shopping", 45.50, shoppingBudget?.id), ("Utilities", 120.00, nil), ("Utilities", 95.50, nil),
            ("Healthcare", 45.00, nil), ("Healthcare", 150.00, nil), ("Gas", 55.00, transportBudget?.id),
            ("Gas", 48.00, transportBudget?.id), ("Coffee", 5.50, diningBudget?.id), ("Coffee", 4.75, diningBudget?.id),
            ("Coffee", 6.00, diningBudget?.id), ("Coffee", 5.25, diningBudget?.id), ("Subscription", 9.99, nil),
            ("Subscription", 14.99, nil), ("Subscription", 19.99, nil)
        ]
        
        for (category, amount, budgetId) in expenses {
            let daysAgo = Int.random(in: 0...30)
            let transactionDate = calendar.date(byAdding: .day, value: -daysAgo, to: now) ?? now
            try await dataService.saveTransaction(Transaction(amount: amount, category: category, date: transactionDate, description: "\(category) Purchase", type: .expense, budgetId: budgetId, createdAt: transactionDate))
        }
        
		// Generate Net Worth
		for monthOffset in 0..<6 {
			let monthDate = calendar.date(byAdding: .month, value: -monthOffset, to: now) ?? now
			let assets = 70000.00 + Double(monthOffset * 500)
			let liabilities = 26540.75 - Double(monthOffset * 200)
			try await dataService.saveNetWorth(NetWorth(assets: assets, liabilities: liabilities, date: monthDate))
		}
		
		// Generate Bills
		let bills = [
			Bill(name: "Electric Bill", amount: 120.00, dueDate: calendar.date(byAdding: .day, value: 5, to: now) ?? now, category: "Utilities", frequency: .monthly, reminderDaysBefore: 3),
			Bill(name: "Internet Service", amount: 79.99, dueDate: calendar.date(byAdding: .day, value: 10, to: now) ?? now, category: "Utilities", frequency: .monthly, reminderDaysBefore: 3),
			Bill(name: "Phone Bill", amount: 95.00, dueDate: calendar.date(byAdding: .day, value: 15, to: now) ?? now, category: "Utilities", frequency: .monthly, reminderDaysBefore: 3),
			Bill(name: "Netflix", amount: 15.99, dueDate: calendar.date(byAdding: .day, value: 20, to: now) ?? now, category: "Entertainment", frequency: .monthly, reminderDaysBefore: 1),
			Bill(name: "Gym Membership", amount: 49.99, dueDate: calendar.date(byAdding: .day, value: 25, to: now) ?? now, category: "Health & Fitness", frequency: .monthly, reminderDaysBefore: 3),
			Bill(name: "Car Insurance", amount: 145.00, dueDate: calendar.date(byAdding: .month, value: 1, to: now) ?? now, category: "Insurance", frequency: .monthly, reminderDaysBefore: 5)
		]
		
		for bill in bills {
			try await dataService.saveBill(bill)
		}
		
		print("✅ Demo data generation complete!")
	}
    
    // MARK: - Logout
    
    private func logout() {
        authService.signOut()
        print("👋 User logged out")
    }
}

struct DataExportView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    @State private var exportText = ""
    
    var body: some View {
        NavigationView {
            VStack {
                TextEditor(text: $exportText)
                    .padding()
            }
            .navigationTitle("Export Data")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
            .task {
                await generateExport()
            }
        }
    }
    
    private func generateExport() async {
        do {
            let transactions = try await dataService.fetchTransactions()
            let exportService = DataExportService()
            exportText = exportService.exportTransactions(transactions)
        } catch {
            exportText = "Error exporting data"
        }
    }
}

