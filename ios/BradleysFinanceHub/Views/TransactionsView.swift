//
//  TransactionsView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct TransactionsView: View {
    @EnvironmentObject var dataService: DataService
    @State private var transactions: [Transaction] = []
    @State private var isLoading = true
    @State private var showingAddTransaction = false
    
    var body: some View {
        NavigationView {
            List {
                ForEach(transactions) { transaction in
                    TransactionRowView(transaction: transaction)
                }
                .onDelete(perform: deleteTransaction)
            }
            .navigationTitle("Transactions")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddTransaction = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddTransaction) {
                AddTransactionView(dataService: dataService)
            }
            .task {
                await loadTransactions()
            }
        }
    }
    
    private func loadTransactions() async {
        do {
            transactions = try await dataService.fetchTransactions()
            isLoading = false
        } catch {
            print("Error loading transactions: \(error)")
            isLoading = false
        }
    }
    
    private func deleteTransaction(at offsets: IndexSet) {
        for index in offsets {
            let transaction = transactions[index]
            Task {
                try? await dataService.deleteTransaction(transaction)
                await loadTransactions()
            }
        }
    }
}

struct TransactionRowView: View {
    let transaction: Transaction
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(transaction.description)
                    .font(.headline)
                Text(transaction.category)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(transaction.date.formatted(date: .abbreviated, time: .omitted))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            Text("$\(String(format: "%.2f", transaction.amount))")
                .font(.headline)
                .foregroundColor(transaction.type == .income ? .green : .red)
        }
    }
}

struct AddTransactionView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    @State private var description = ""
    @State private var amount = ""
    @State private var category = ""
    @State private var type: Transaction.TransactionType = .expense
    @State private var date = Date()
    
    var body: some View {
        NavigationView {
            Form {
                TextField("Description", text: $description)
                TextField("Amount", text: $amount)
                    .keyboardType(.decimalPad)
                TextField("Category", text: $category)
                Picker("Type", selection: $type) {
                    Text("Expense").tag(Transaction.TransactionType.expense)
                    Text("Income").tag(Transaction.TransactionType.income)
                }
                DatePicker("Date", selection: $date, displayedComponents: .date)
            }
            .navigationTitle("Add Transaction")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveTransaction()
                    }
                }
            }
        }
    }
    
    private func saveTransaction() {
        guard let amountValue = Double(amount) else { return }
        
        let transaction = Transaction(
            id: UUID().uuidString,
            amount: amountValue,
            category: category,
            date: date,
            description: description,
            type: type,
            budgetId: nil,
            accountId: nil,
            tags: [],
            splitTransactions: [],
            createdAt: Date()
        )
        
        Task {
            try? await dataService.saveTransaction(transaction)
            dismiss()
        }
    }
}

