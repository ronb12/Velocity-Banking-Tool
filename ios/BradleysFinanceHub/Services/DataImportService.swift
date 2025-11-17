//
//  DataImportService.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import Foundation

class DataImportService {
    func parseCSV(_ csv: String) -> [[String]] {
        var result: [[String]] = []
        let lines = csv.components(separatedBy: .newlines)
        for line in lines where !line.isEmpty {
            let fields = line.components(separatedBy: ",")
            result.append(fields)
        }
        return result
    }
    
    func importTransactions(from csv: String) -> [Transaction] {
        let rows = parseCSV(csv)
        guard rows.count > 1 else { return [] }
        
        var transactions: [Transaction] = []
        for i in 1..<rows.count {
            let row = rows[i]
            guard row.count >= 5,
                  let date = ISO8601DateFormatter().date(from: row[0]),
                  let amount = Double(row[2]) else { continue }
            
            let transaction = Transaction(
                id: UUID().uuidString,
                amount: amount,
                category: row[3],
                date: date,
                description: row[1],
                type: Transaction.TransactionType(rawValue: row[4]) ?? .expense,
                budgetId: nil,
                accountId: nil,
                tags: [],
                splitTransactions: [],
                createdAt: Date()
            )
            transactions.append(transaction)
        }
        return transactions
    }
}

