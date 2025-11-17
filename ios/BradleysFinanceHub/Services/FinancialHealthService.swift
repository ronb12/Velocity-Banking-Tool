//
//  FinancialHealthService.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import Foundation

class FinancialHealthService {
    func calculateHealthScore(debts: [Debt], savings: [SavingsGoal], netWorth: Double) -> Int {
        var score = 100
        
        // Deduct points for debt
        let totalDebt = debts.reduce(0) { $0 + $1.balance }
        if totalDebt > 0 {
            let debtRatio = totalDebt / max(abs(netWorth), 1)
            score -= Int(min(debtRatio * 30, 30))
        }
        
        // Add points for savings
        let totalSavings = savings.reduce(0) { $0 + $1.currentAmount }
        if totalSavings > 0 {
            score += min(Int(totalSavings / 1000), 20)
        }
        
        // Net worth bonus
        if netWorth > 0 {
            score += min(Int(netWorth / 10000), 20)
        }
        
        return max(0, min(100, score))
    }
    
    func getHealthStatus(score: Int) -> String {
        switch score {
        case 80...100: return "Excellent"
        case 60..<80: return "Good"
        case 40..<60: return "Fair"
        default: return "Needs Improvement"
        }
    }
}

