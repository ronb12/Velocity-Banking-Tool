//
//  RecurringTransactionsView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct RecurringTransactionsView: View {
    @State private var recurringTransactions: [RecurringTransaction] = []
    @State private var showingAdd = false
    
    var body: some View {
        NavigationView {
            List {
                ForEach(recurringTransactions) { transaction in
                    RecurringTransactionRowView(transaction: transaction)
                }
                .onDelete(perform: deleteTransaction)
            }
            .navigationTitle("Recurring Transactions")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAdd = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAdd) {
                AddRecurringTransactionView()
            }
        }
    }
    
    private func deleteTransaction(at offsets: IndexSet) {
        recurringTransactions.remove(atOffsets: offsets)
    }
}

struct RecurringTransactionRowView: View {
    let transaction: RecurringTransaction
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(transaction.name)
                .font(.headline)
            Text("$\(String(format: "%.2f", transaction.amount)) - \(transaction.frequency.rawValue)")
                .font(.subheadline)
                .foregroundColor(.secondary)
            Text("Next: \(transaction.nextDate.formatted(date: .abbreviated, time: .omitted))")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct AddRecurringTransactionView: View {
    @Environment(\.dismiss) var dismiss
    @State private var description = ""
    @State private var amount = ""
    @State private var frequency: RecurringTransaction.Frequency = .monthly
    
    var body: some View {
        NavigationView {
            Form {
                TextField("Description", text: $description)
                TextField("Amount", text: $amount)
                    .keyboardType(.decimalPad)
                Picker("Frequency", selection: $frequency) {
                    Text("Daily").tag(RecurringTransaction.Frequency.daily)
                    Text("Weekly").tag(RecurringTransaction.Frequency.weekly)
                    Text("Monthly").tag(RecurringTransaction.Frequency.monthly)
                    Text("Yearly").tag(RecurringTransaction.Frequency.yearly)
                }
            }
            .navigationTitle("Add Recurring Transaction")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { dismiss() }
                }
            }
        }
    }
}

