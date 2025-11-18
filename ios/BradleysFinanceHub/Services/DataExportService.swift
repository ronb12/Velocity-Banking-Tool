//
//  DataExportService.swift
//  BradleysFinanceHub
//
//  Enhanced export service with PDF support
//

import Foundation
import UIKit
import PDFKit

class DataExportService {
    // MARK: - CSV Export
    
    func exportTransactions(_ transactions: [Transaction]) -> String {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        var csv = "Date,Description,Amount,Category,Type\n"
        for transaction in transactions {
            csv += "\(dateFormatter.string(from: transaction.date)),\(transaction.description),\(transaction.amount),\(transaction.category),\(transaction.type.rawValue)\n"
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
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        var csv = "Name,Balance,Interest Rate,Minimum Payment,Due Date\n"
        for debt in debts {
            let dueDateString = debt.dueDate.map { dateFormatter.string(from: $0) } ?? ""
            csv += "\(debt.name),\(debt.balance),\(debt.interestRate),\(debt.minimumPayment),\(dueDateString)\n"
        }
        return csv
    }
    
    // MARK: - PDF Export
    
    func generatePDFReport(
        transactions: [Transaction],
        budgets: [Budget],
        debts: [Debt],
        savingsGoals: [SavingsGoal],
        title: String = "Financial Report"
    ) -> Data? {
        let pdfMetaData = [
            kCGPDFContextCreator: "Bradley's Finance Hub",
            kCGPDFContextAuthor: "User",
            kCGPDFContextTitle: title
        ]
        let format = UIGraphicsPDFRendererFormat()
        format.documentInfo = pdfMetaData as [String: Any]
        
        let pageWidth = 8.5 * 72.0
        let pageHeight = 11 * 72.0
        let pageRect = CGRect(x: 0, y: 0, width: pageWidth, height: pageHeight)
        
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect, format: format)
        
        let data = renderer.pdfData { context in
            context.beginPage()
            
            var yPosition: CGFloat = 72
            
            // Title
            let titleAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.boldSystemFont(ofSize: 24),
                .foregroundColor: UIColor.label
            ]
            let titleString = NSAttributedString(string: title, attributes: titleAttributes)
            titleString.draw(at: CGPoint(x: 72, y: yPosition))
            yPosition += 40
            
            // Date
            let dateFormatter = DateFormatter()
            dateFormatter.dateStyle = .long
            let dateString = "Generated: \(dateFormatter.string(from: Date()))"
            let dateAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 12),
                .foregroundColor: UIColor.secondaryLabel
            ]
            NSAttributedString(string: dateString, attributes: dateAttributes)
                .draw(at: CGPoint(x: 72, y: yPosition))
            yPosition += 30
            
            // Transactions Section
            if !transactions.isEmpty {
                yPosition = addSection(
                    title: "Transactions",
                    items: transactions.map { "\(formatDate($0.date)) - \($0.description) - $\(String(format: "%.2f", $0.amount))" },
                    yPosition: yPosition,
                    pageRect: pageRect,
                    context: context
                )
            }
            
            // Budgets Section
            if !budgets.isEmpty {
                yPosition = addSection(
                    title: "Budgets",
                    items: budgets.map { "\($0.category): $\(String(format: "%.2f", $0.spentAmount)) / $\(String(format: "%.2f", $0.budgetedAmount))" },
                    yPosition: yPosition,
                    pageRect: pageRect,
                    context: context
                )
            }
            
            // Debts Section
            if !debts.isEmpty {
                yPosition = addSection(
                    title: "Debts",
                    items: debts.map { "\($0.name): $\(String(format: "%.2f", $0.balance))" },
                    yPosition: yPosition,
                    pageRect: pageRect,
                    context: context
                )
            }
        }
        
        return data
    }
    
    private func addSection(
        title: String,
        items: [String],
        yPosition: CGFloat,
        pageRect: CGRect,
        context: UIGraphicsPDFRendererContext
    ) -> CGFloat {
        var currentY = yPosition
        
        // Check if we need a new page
        if currentY > pageRect.height - 200 {
            context.beginPage()
            currentY = 72
        }
        
        // Section Title
        let titleAttributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.boldSystemFont(ofSize: 18),
            .foregroundColor: UIColor.label
        ]
        NSAttributedString(string: title, attributes: titleAttributes)
            .draw(at: CGPoint(x: 72, y: currentY))
        currentY += 25
        
        // Items
        let itemAttributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 12),
            .foregroundColor: UIColor.label
        ]
        
        for item in items.prefix(20) { // Limit to 20 items per section
            if currentY > pageRect.height - 100 {
                context.beginPage()
                currentY = 72
            }
            NSAttributedString(string: "• \(item)", attributes: itemAttributes)
                .draw(at: CGPoint(x: 90, y: currentY))
            currentY += 20
        }
        
        return currentY + 20
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        return formatter.string(from: date)
    }
}

