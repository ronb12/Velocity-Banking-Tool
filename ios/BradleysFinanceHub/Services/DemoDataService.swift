//
//  DemoDataService.swift
//  BradleysFinanceHub
//
//  Service to generate demo data for testing and design purposes
//

import Foundation

class DemoDataService {
    let dataService: DataService
    
    init(dataService: DataService) {
        self.dataService = dataService
    }
    
    // MARK: - Generate All Demo Data
    
    func generateAllDemoData() async throws {
        print("🎭 Starting demo data generation...")
        
        // Generate in order to maintain relationships
        let budgets = try await generateBudgets()
        let debts = try await generateDebts()
        let savingsGoals = try await generateSavingsGoals()
        let transactions = try await generateTransactions(budgets: budgets)
        try await generateNetWorth()
        
        print("✅ Demo data generation complete!")
        print("   📊 Created:")
        print("      - \(budgets.count) budgets")
        print("      - \(debts.count) debts")
        print("      - \(savingsGoals.count) savings goals")
        print("      - \(transactions.count) transactions")
        print("      - 6 net worth entries")
    }
    
    // MARK: - Generate Budgets
    
    private func generateBudgets() async throws -> [Budget] {
        let calendar = Calendar.current
        let now = Date()
        let currentMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: now)) ?? now
        
        let budgets = [
            Budget(
                category: "Groceries",
                budgetedAmount: 600.00,
                spentAmount: 485.30,
                month: currentMonth
            ),
            Budget(
                category: "Dining Out",
                budgetedAmount: 300.00,
                spentAmount: 287.50,
                month: currentMonth
            ),
            Budget(
                category: "Transportation",
                budgetedAmount: 400.00,
                spentAmount: 320.00,
                month: currentMonth
            ),
            Budget(
                category: "Entertainment",
                budgetedAmount: 200.00,
                spentAmount: 145.00,
                month: currentMonth
            ),
            Budget(
                category: "Shopping",
                budgetedAmount: 500.00,
                spentAmount: 520.00, // Over budget
                month: currentMonth
            ),
            Budget(
                category: "Utilities",
                budgetedAmount: 250.00,
                spentAmount: 235.00,
                month: currentMonth
            ),
            Budget(
                category: "Healthcare",
                budgetedAmount: 300.00,
                spentAmount: 180.00,
                month: currentMonth
            )
        ]
        
        for budget in budgets {
            try await dataService.saveBudget(budget)
        }
        
        return budgets
    }
    
    // MARK: - Generate Debts
    
    private func generateDebts() async throws -> [Debt] {
        let calendar = Calendar.current
        let now = Date()
        
        let debts = [
            Debt(
                name: "Credit Card - Chase",
                balance: 2340.75,
                interestRate: 18.99,
                minimumPayment: 75.00,
                dueDate: calendar.date(byAdding: .day, value: 15, to: now),
                createdAt: calendar.date(byAdding: .year, value: -1, to: now) ?? now
            ),
            Debt(
                name: "Student Loan",
                balance: 12500.00,
                interestRate: 4.5,
                minimumPayment: 250.00,
                dueDate: calendar.date(byAdding: .day, value: 5, to: now),
                createdAt: calendar.date(byAdding: .year, value: -3, to: now) ?? now
            ),
            Debt(
                name: "Car Loan",
                balance: 8500.00,
                interestRate: 3.9,
                minimumPayment: 320.00,
                dueDate: calendar.date(byAdding: .day, value: 20, to: now),
                createdAt: calendar.date(byAdding: .year, value: -2, to: now) ?? now
            ),
            Debt(
                name: "Personal Loan",
                balance: 3200.00,
                interestRate: 12.5,
                minimumPayment: 150.00,
                dueDate: calendar.date(byAdding: .day, value: 10, to: now),
                createdAt: calendar.date(byAdding: .month, value: -6, to: now) ?? now
            )
        ]
        
        for debt in debts {
            try await dataService.saveDebt(debt)
        }
        
        return debts
    }
    
    // MARK: - Generate Savings Goals
    
    private func generateSavingsGoals() async throws -> [SavingsGoal] {
        let calendar = Calendar.current
        let now = Date()
        
        let goals = [
            SavingsGoal(
                name: "Emergency Fund",
                targetAmount: 10000.00,
                currentAmount: 8000.00,
                targetDate: calendar.date(byAdding: .month, value: 3, to: now),
                priority: 1,
                createdAt: calendar.date(byAdding: .year, value: -1, to: now) ?? now
            ),
            SavingsGoal(
                name: "Vacation to Europe",
                targetAmount: 5000.00,
                currentAmount: 3200.00,
                targetDate: calendar.date(byAdding: .month, value: 6, to: now),
                priority: 2,
                createdAt: calendar.date(byAdding: .month, value: -4, to: now) ?? now
            ),
            SavingsGoal(
                name: "New Laptop",
                targetAmount: 2000.00,
                currentAmount: 850.00,
                targetDate: calendar.date(byAdding: .month, value: 2, to: now),
                priority: 3,
                createdAt: calendar.date(byAdding: .month, value: -2, to: now) ?? now
            ),
            SavingsGoal(
                name: "Down Payment for House",
                targetAmount: 50000.00,
                currentAmount: 12500.00,
                targetDate: calendar.date(byAdding: .year, value: 2, to: now),
                priority: 1,
                createdAt: calendar.date(byAdding: .year, value: -2, to: now) ?? now
            ),
            SavingsGoal(
                name: "Wedding Fund",
                targetAmount: 15000.00,
                currentAmount: 5200.00,
                targetDate: calendar.date(byAdding: .year, value: 1, to: now),
                priority: 2,
                createdAt: calendar.date(byAdding: .month, value: -8, to: now) ?? now
            )
        ]
        
        for goal in goals {
            try await dataService.saveSavingsGoal(goal)
        }
        
        return goals
    }
    
    // MARK: - Generate Transactions
    
    private func generateTransactions(budgets: [Budget]) async throws -> [Transaction] {
        let calendar = Calendar.current
        let now = Date()
        var transactions: [Transaction] = []
        
        // Get budget IDs
        let groceriesBudget = budgets.first { $0.category == "Groceries" }
        let diningBudget = budgets.first { $0.category == "Dining Out" }
        let transportBudget = budgets.first { $0.category == "Transportation" }
        let entertainmentBudget = budgets.first { $0.category == "Entertainment" }
        let shoppingBudget = budgets.first { $0.category == "Shopping" }
        
        // Income transactions (last 3 months)
        for monthOffset in 0..<3 {
            let monthDate = calendar.date(byAdding: .month, value: -monthOffset, to: now) ?? now
            let payday1 = calendar.date(byAdding: .day, value: 1, to: monthDate) ?? monthDate
            let payday2 = calendar.date(byAdding: .day, value: 15, to: monthDate) ?? monthDate
            
            transactions.append(Transaction(
                amount: 3500.00,
                category: "Salary",
                date: payday1,
                description: "Monthly Salary",
                type: .income,
                accountId: nil,
                createdAt: payday1
            ))
            
            transactions.append(Transaction(
                amount: 3500.00,
                category: "Salary",
                date: payday2,
                description: "Monthly Salary",
                type: .income,
                accountId: nil,
                createdAt: payday2
            ))
        }
        
        // Expense transactions (last 30 days)
        let expenseCategories = [
            ("Groceries", 45.99, groceriesBudget?.id),
            ("Groceries", 78.50, groceriesBudget?.id),
            ("Groceries", 32.25, groceriesBudget?.id),
            ("Groceries", 95.00, groceriesBudget?.id),
            ("Dining Out", 28.50, diningBudget?.id),
            ("Dining Out", 45.00, diningBudget?.id),
            ("Dining Out", 67.30, diningBudget?.id),
            ("Dining Out", 22.00, diningBudget?.id),
            ("Transportation", 45.00, transportBudget?.id),
            ("Transportation", 60.00, transportBudget?.id),
            ("Transportation", 35.00, transportBudget?.id),
            ("Entertainment", 15.99, entertainmentBudget?.id),
            ("Entertainment", 45.00, entertainmentBudget?.id),
            ("Entertainment", 28.50, entertainmentBudget?.id),
            ("Shopping", 89.99, shoppingBudget?.id),
            ("Shopping", 125.00, shoppingBudget?.id),
            ("Shopping", 45.50, shoppingBudget?.id),
            ("Utilities", 120.00, nil),
            ("Utilities", 95.50, nil),
            ("Healthcare", 45.00, nil),
            ("Healthcare", 150.00, nil),
            ("Gas", 55.00, transportBudget?.id),
            ("Gas", 48.00, transportBudget?.id),
            ("Coffee", 5.50, diningBudget?.id),
            ("Coffee", 4.75, diningBudget?.id),
            ("Coffee", 6.00, diningBudget?.id),
            ("Coffee", 5.25, diningBudget?.id),
            ("Subscription", 9.99, nil),
            ("Subscription", 14.99, nil),
            ("Subscription", 19.99, nil)
        ]
        
        for (index, (category, amount, budgetId)) in expenseCategories.enumerated() {
            let daysAgo = Int.random(in: 0...30)
            let transactionDate = calendar.date(byAdding: .day, value: -daysAgo, to: now) ?? now
            
            transactions.append(Transaction(
                amount: amount,
                category: category,
                date: transactionDate,
                description: "\(category) Purchase",
                type: .expense,
                budgetId: budgetId,
                accountId: nil, // Account linking can be added later
                createdAt: transactionDate
            ))
        }
        
        // Save all transactions
        for transaction in transactions {
            try await dataService.saveTransaction(transaction)
        }
        
        return transactions
    }
    
    // MARK: - Generate Net Worth
    
    private func generateNetWorth() async throws {
        let calendar = Calendar.current
        let now = Date()
        
        // Generate net worth entries for last 6 months
        for monthOffset in 0..<6 {
            let monthDate = calendar.date(byAdding: .month, value: -monthOffset, to: now) ?? now
            let assets = 70000.00 + Double(monthOffset * 500) // Growing assets
            let liabilities = 26540.75 - Double(monthOffset * 200) // Decreasing liabilities
            
            let netWorth = NetWorth(
                id: UUID().uuidString,
                assets: assets,
                liabilities: liabilities,
                date: monthDate
            )
            
            try await dataService.saveNetWorth(netWorth)
        }
    }
    
}

