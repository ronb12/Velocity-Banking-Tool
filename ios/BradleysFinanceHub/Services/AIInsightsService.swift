//
//  AIInsightsService.swift
//  BradleysFinanceHub
//
//  AI-powered spending insights and predictions
//

import Foundation

class AIInsightsService {
    static let shared = AIInsightsService()
    
    private init() {}
    
    // MARK: - Spending Predictions
    
    func predictMonthlySpending(transactions: [Transaction]) -> Double {
        let expenses = transactions.filter { $0.type == .expense }
        let calendar = Calendar.current
        
        // Get last 3 months of data
        let threeMonthsAgo = calendar.date(byAdding: .month, value: -3, to: Date()) ?? Date()
        let recentExpenses = expenses.filter { $0.date >= threeMonthsAgo }
        
        guard !recentExpenses.isEmpty else { return 0 }
        
        // Calculate average monthly spending
        let monthlyTotals = Dictionary(grouping: recentExpenses) { transaction in
            calendar.dateComponents([.year, .month], from: transaction.date)
        }
        .map { $0.value.reduce(0) { $0 + $1.amount } }
        
        return monthlyTotals.isEmpty ? 0 : monthlyTotals.reduce(0, +) / Double(monthlyTotals.count)
    }
    
    // MARK: - Anomaly Detection
    
    func detectAnomalies(transactions: [Transaction]) -> [SpendingAnomaly] {
        var anomalies: [SpendingAnomaly] = []
        let expenses = transactions.filter { $0.type == .expense }
        
        // Group by category
        let categorySpending = Dictionary(grouping: expenses) { $0.category }
            .mapValues { transactions in
                transactions.reduce(0) { $0 + $1.amount }
            }
        
        // Calculate average spending per category
        let avgSpending = categorySpending.values.reduce(0, +) / Double(categorySpending.count)
        
        // Detect unusual spending
        for (category, total) in categorySpending {
            if total > avgSpending * 2 {
                anomalies.append(SpendingAnomaly(
                    type: .unusualSpending,
                    category: category,
                    amount: total,
                    message: "Unusually high spending in \(category)"
                ))
            }
        }
        
        // Detect large transactions
        let largeTransactions = expenses.filter { $0.amount > 500 }
        for transaction in largeTransactions {
            anomalies.append(SpendingAnomaly(
                type: .largeTransaction,
                category: transaction.category,
                amount: transaction.amount,
                message: "Large transaction: $\(String(format: "%.2f", transaction.amount))"
            ))
        }
        
        return anomalies
    }
    
    // MARK: - Spending Trends
    
    func analyzeSpendingTrend(transactions: [Transaction], category: String? = nil) -> SpendingTrend {
        let expenses = transactions.filter { transaction in
            if let category = category {
                return transaction.type == .expense && transaction.category == category
            }
            return transaction.type == .expense
        }
        
        let calendar = Calendar.current
        let sixMonthsAgo = calendar.date(byAdding: .month, value: -6, to: Date()) ?? Date()
        let recentExpenses = expenses.filter { $0.date >= sixMonthsAgo }
        
        // Group by month
        let monthlySpending = Dictionary(grouping: recentExpenses) { transaction in
            calendar.dateComponents([.year, .month], from: transaction.date)
        }
        .mapValues { transactions in
            transactions.reduce(0) { $0 + $1.amount }
        }
        .sorted { $0.key < $1.key }
        
        guard monthlySpending.count >= 2 else {
            return SpendingTrend(direction: .stable, percentage: 0, message: "Insufficient data")
        }
        
        let amounts = monthlySpending.map { $0.value }
        let firstHalf = amounts.prefix(amounts.count / 2).reduce(0, +) / Double(amounts.count / 2)
        let secondHalf = amounts.suffix(amounts.count / 2).reduce(0, +) / Double(amounts.count / 2)
        
        let change = ((secondHalf - firstHalf) / firstHalf) * 100
        
        let direction: TrendDirection = change > 5 ? .increasing : change < -5 ? .decreasing : .stable
        let message = direction == .increasing ? "Spending is increasing" :
                     direction == .decreasing ? "Spending is decreasing" :
                     "Spending is stable"
        
        return SpendingTrend(
            direction: direction,
            percentage: abs(change),
            message: message
        )
    }
    
    // MARK: - Smart Recommendations
    
    func generateRecommendations(
        transactions: [Transaction],
        budgets: [Budget],
        debts: [Debt]
    ) -> [Recommendation] {
        var recommendations: [Recommendation] = []
        
        // Budget recommendations
        for budget in budgets {
            let percentage = (budget.spentAmount / budget.budgetedAmount) * 100
            if percentage > 90 {
                recommendations.append(Recommendation(
                    type: .budgetWarning,
                    title: "Budget Alert",
                    message: "You've spent \(Int(percentage))% of your \(budget.category) budget",
                    priority: .high
                ))
            }
        }
        
        // Debt recommendations
        let totalDebt = debts.reduce(0) { $0 + $1.balance }
        if totalDebt > 0 {
            let highInterestDebts = debts.filter { $0.interestRate > 10 }
            if !highInterestDebts.isEmpty {
                recommendations.append(Recommendation(
                    type: .debtPayoff,
                    title: "High Interest Debt",
                    message: "Consider paying off high-interest debt first",
                    priority: .high
                ))
            }
        }
        
        // Savings recommendations
        let income = transactions.filter { $0.type == .income }.reduce(0) { $0 + $1.amount }
        let expenses = transactions.filter { $0.type == .expense }.reduce(0) { $0 + $1.amount }
        let savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0
        
        if savingsRate < 20 {
            recommendations.append(Recommendation(
                type: .savings,
                title: "Low Savings Rate",
                message: "Try to save at least 20% of your income",
                priority: .medium
            ))
        }
        
        return recommendations
    }
}

// MARK: - Data Models

struct SpendingAnomaly: Identifiable {
    let id = UUID()
    let type: AnomalyType
    let category: String
    let amount: Double
    let message: String
    
    enum AnomalyType {
        case unusualSpending
        case largeTransaction
        case duplicateTransaction
    }
}

struct SpendingTrend {
    let direction: TrendDirection
    let percentage: Double
    let message: String
    
    enum TrendDirection {
        case increasing
        case decreasing
        case stable
    }
}

struct Recommendation: Identifiable {
    let id = UUID()
    let type: RecommendationType
    let title: String
    let message: String
    let priority: Priority
    
    enum RecommendationType {
        case budgetWarning
        case debtPayoff
        case savings
        case spending
    }
    
    enum Priority {
        case high
        case medium
        case low
    }
}

