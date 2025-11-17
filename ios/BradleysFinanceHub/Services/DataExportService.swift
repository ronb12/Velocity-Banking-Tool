//
//  DataExportService.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import Foundation

class DataExportService {
    func exportTransactions(_ transactions: [Transaction]) -> String {
        var csv = "Date,Description,Amount,Category,Type\n"
        for transaction in transactions {
            csv += "\(transaction.date),\(transaction.description),\(transaction.amount),\(transaction.category),\(transaction.type.rawValue)\n"
        }
        return csv
    }
    
    func exportBudgets(_ budgets: [Budget]) -> String {
        var csv = "Category,Budgeted,Spent,Month\n"
        for budget in budgets {
            csv += "\(budget.category),\(budget.budgetedAmount),\(budget.spentAmount),\(budget.month)\n"
        }
        return csv
    }
    
    func exportDebts(_ debts: [Debt]) -> String {
        var csv = "Name,Balance,Interest Rate,Minimum Payment,Due Date\n"
        for debt in debts {
            csv += "\(debt.name),\(debt.balance),\(debt.interestRate),\(debt.minimumPayment),\(debt.dueDate)\n"
        }
        return csv
    }
}

