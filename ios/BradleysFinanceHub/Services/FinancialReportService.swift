//
//  FinancialReportService.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import Foundation

class FinancialReportService {
    func generateMonthlyReport(transactions: [Transaction], budgets: [Budget], month: Date) -> String {
        let calendar = Calendar.current
        guard let startOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: month)),
              let endOfMonth = calendar.date(byAdding: .month, value: 1, to: startOfMonth) else {
            return "Error: Could not calculate date range"
        }
        
        let monthlyTransactions = transactions.filter { $0.date >= startOfMonth && $0.date < endOfMonth }
        let income = monthlyTransactions.filter { $0.type == .income }.reduce(0) { $0 + $1.amount }
        let expenses = monthlyTransactions.filter { $0.type == .expense }.reduce(0) { $0 + $1.amount }
        
        var report = "Monthly Financial Report\n"
        report += "Month: \(month.formatted(date: .abbreviated, time: .omitted))\n\n"
        report += "Income: $\(String(format: "%.2f", income))\n"
        report += "Expenses: $\(String(format: "%.2f", expenses))\n"
        report += "Net: $\(String(format: "%.2f", income - expenses))\n\n"
        
        report += "Budget Summary:\n"
        for budget in budgets {
            let spent = budget.spentAmount
            let budgeted = budget.budgetedAmount
            let percentage = (spent / budgeted) * 100
            report += "\(budget.category): $\(String(format: "%.2f", spent)) / $\(String(format: "%.2f", budgeted)) (\(Int(percentage))%)\n"
        }
        
        return report
    }
}

