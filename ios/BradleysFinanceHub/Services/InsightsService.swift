//
//  InsightsService.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import Foundation

class InsightsService {
    func getSpendingInsights(transactions: [Transaction]) -> [String] {
        var insights: [String] = []
        
        let expenses = transactions.filter { $0.type == .expense }
        let totalExpenses = expenses.reduce(0) { $0 + $1.amount }
        
        if totalExpenses > 0 {
            let categoryTotals = Dictionary(grouping: expenses, by: { $0.category })
                .mapValues { $0.reduce(0) { $0 + $1.amount } }
            
            if let topCategory = categoryTotals.max(by: { $0.value < $1.value }) {
                let percentage = (topCategory.value / totalExpenses) * 100
                insights.append("You spend \(Int(percentage))% of your expenses on \(topCategory.key)")
            }
        }
        
        let monthlyExpenses = Dictionary(grouping: expenses) { transaction in
            Calendar.current.component(.month, from: transaction.date)
        }.mapValues { $0.reduce(0) { $0 + $1.amount } }
        
        if monthlyExpenses.count > 1 {
            let sorted = monthlyExpenses.sorted { $0.value > $1.value }
            if let highest = sorted.first {
                insights.append("Your highest spending month was \(highest.key) with $\(String(format: "%.2f", highest.value))")
            }
        }
        
        return insights
    }
    
    func getSavingsInsights(goals: [SavingsGoal]) -> [String] {
        var insights: [String] = []
        
        let totalProgress = goals.reduce(0) { $0 + ($1.currentAmount / $1.targetAmount) }
        let averageProgress = goals.isEmpty ? 0 : totalProgress / Double(goals.count) * 100
        
        if averageProgress > 0 {
            insights.append("You're \(Int(averageProgress))% towards your savings goals on average")
        }
        
        if let closestGoal = goals.filter({ $0.currentAmount < $0.targetAmount }).min(by: { $0.targetAmount - $0.currentAmount < $1.targetAmount - $1.currentAmount }) {
            let remaining = closestGoal.targetAmount - closestGoal.currentAmount
            insights.append("You need $\(String(format: "%.2f", remaining)) more to reach your \(closestGoal.name) goal")
        }
        
        return insights
    }
}

