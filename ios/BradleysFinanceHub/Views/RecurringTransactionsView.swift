//
//  RecurringTransactionsView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct RecurringTransactionsView: View {
    @EnvironmentObject var dataService: DataService
    @State private var recurringTransactions: [RecurringTransaction] = []
    @State private var showingAdd = false
    @State private var editingTransaction: RecurringTransaction?
    @State private var isLoading = true
    @State private var toastMessage: String?
    
    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    ProgressView()
                } else if recurringTransactions.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "repeat.circle")
                            .font(.system(size: 50))
                            .foregroundColor(.secondary)
                        Text("No Recurring Transactions")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        Text("Tap the + button to add a recurring transaction")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List {
                        ForEach(recurringTransactions) { transaction in
                            RecurringTransactionRowView(transaction: transaction)
                                .onTapGesture {
                                    editingTransaction = transaction
                                }
                        }
                        .onDelete(perform: deleteTransaction)
                    }
                }
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
                AddRecurringTransactionView(dataService: dataService)
                    .onDisappear {
                        Task {
                            await loadRecurringTransactions()
                        }
                    }
            }
            .sheet(item: $editingTransaction) { transaction in
                EditRecurringTransactionView(dataService: dataService, transaction: transaction)
                    .onDisappear {
                        Task {
                            await loadRecurringTransactions()
                        }
                    }
            }
            .task {
                await loadRecurringTransactions()
            }
        }
        .toast(message: $toastMessage)
    }
    
    private func loadRecurringTransactions() async {
        do {
            recurringTransactions = try await dataService.fetchRecurringTransactions()
            isLoading = false
        } catch {
            print("Error loading recurring transactions: \(error)")
            isLoading = false
        }
    }
    
    private func deleteTransaction(at offsets: IndexSet) {
        for index in offsets {
            let transaction = recurringTransactions[index]
            Task {
                do {
                    try await dataService.deleteRecurringTransaction(transaction)
                    HapticFeedback.success()
                    toastMessage = "Recurring transaction deleted"
                    await loadRecurringTransactions()
                } catch {
                    HapticFeedback.error()
                    toastMessage = "Failed to delete"
                }
            }
        }
    }
}

struct RecurringTransactionRowView: View {
    let transaction: RecurringTransaction
    
    var body: some View {
        HStack(spacing: 16) {
            // Icon
            ZStack {
                Circle()
                    .fill(transaction.type == .income ? Color.green.opacity(0.2) : Color.red.opacity(0.2))
                    .frame(width: 50, height: 50)
                Image(systemName: transaction.type == .income ? "arrow.down.circle.fill" : "arrow.up.circle.fill")
                    .foregroundColor(transaction.type == .income ? .green : .red)
                    .font(.title3)
            }
            
            // Info
            VStack(alignment: .leading, spacing: 6) {
                Text(transaction.name)
                    .font(.headline)
                Text(transaction.category)
                    .font(.caption)
                    .foregroundColor(.secondary)
                HStack {
                    Text("$\(String(format: "%.2f", transaction.amount))")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(transaction.type == .income ? .green : .red)
                    Text("•")
                        .foregroundColor(.secondary)
                    Text(transaction.frequency.rawValue.capitalized)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            // Next Date
            VStack(alignment: .trailing, spacing: 4) {
                Text("Next")
                    .font(.caption2)
                    .foregroundColor(.secondary)
                Text(transaction.nextDate, style: .date)
                    .font(.caption)
                    .fontWeight(.medium)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct AddRecurringTransactionView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    @State private var name = ""
    @State private var amount = ""
    @State private var category = ""
    @State private var type: Transaction.TransactionType = .expense
    @State private var frequency: RecurringTransaction.Frequency = .monthly
    @State private var startDate = Date()
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var toastMessage: String?
    
    var body: some View {
        NavigationView {
            Form {
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                TextField("Name", text: $name)
                TextField("Amount", text: $amount)
                    .keyboardType(.decimalPad)
                TextField("Category", text: $category)
                Picker("Type", selection: $type) {
                    Text("Expense").tag(Transaction.TransactionType.expense)
                    Text("Income").tag(Transaction.TransactionType.income)
                }
                Picker("Frequency", selection: $frequency) {
                    Text("Daily").tag(RecurringTransaction.Frequency.daily)
                    Text("Weekly").tag(RecurringTransaction.Frequency.weekly)
                    Text("Monthly").tag(RecurringTransaction.Frequency.monthly)
                    Text("Yearly").tag(RecurringTransaction.Frequency.yearly)
                }
                DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
            }
            .navigationTitle("Add Recurring Transaction")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveRecurringTransaction()
                    }
                    .disabled(isSaving || name.isEmpty || amount.isEmpty || category.isEmpty)
                }
            }
        }
        .toast(message: $toastMessage)
    }
    
    private func saveRecurringTransaction() {
        guard let amountValue = Double(amount), amountValue > 0 else {
            errorMessage = "Please enter a valid amount"
            return
        }
        
        guard !name.isEmpty, !category.isEmpty else {
            errorMessage = "Please fill in all required fields"
            return
        }
        
        isSaving = true
        errorMessage = nil
        
        // Calculate next date based on frequency
        let calendar = Calendar.current
        var nextDate = startDate
        switch frequency {
        case .daily:
            nextDate = calendar.date(byAdding: .day, value: 1, to: startDate) ?? startDate
        case .weekly:
            nextDate = calendar.date(byAdding: .day, value: 7, to: startDate) ?? startDate
        case .biweekly:
            nextDate = calendar.date(byAdding: .day, value: 14, to: startDate) ?? startDate
        case .monthly:
            nextDate = calendar.date(byAdding: .month, value: 1, to: startDate) ?? startDate
        case .yearly:
            nextDate = calendar.date(byAdding: .year, value: 1, to: startDate) ?? startDate
        }
        
        let recurring = RecurringTransaction(
            name: name,
            amount: amountValue,
            category: category,
            type: type,
            frequency: frequency,
            nextDate: nextDate
        )
        
        Task {
            do {
                try await dataService.saveRecurringTransaction(recurring)
                HapticFeedback.success()
                toastMessage = "Recurring transaction saved"
                await MainActor.run {
                    isSaving = false
                    dismiss()
                }
            } catch {
                HapticFeedback.error()
                await MainActor.run {
                    isSaving = false
                    errorMessage = "Failed to save: \(error.localizedDescription)"
                }
            }
        }
    }
}


struct EditRecurringTransactionView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    let transaction: RecurringTransaction
    @State private var name: String
    @State private var amount: String
    @State private var category: String
    @State private var type: Transaction.TransactionType
    @State private var frequency: RecurringTransaction.Frequency
    @State private var startDate: Date
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var toastMessage: String?
    @State private var showingDeleteAlert = false
    
    init(dataService: DataService, transaction: RecurringTransaction) {
        self.dataService = dataService
        self.transaction = transaction
        _name = State(initialValue: transaction.name)
        _amount = State(initialValue: String(format: "%.2f", transaction.amount))
        _category = State(initialValue: transaction.category)
        _type = State(initialValue: transaction.type)
        _frequency = State(initialValue: transaction.frequency)
        _startDate = State(initialValue: transaction.nextDate)
    }
    
    var body: some View {
        NavigationView {
            Form {
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                TextField("Name", text: $name)
                TextField("Amount", text: $amount)
                    .keyboardType(.decimalPad)
                TextField("Category", text: $category)
                Picker("Type", selection: $type) {
                    Text("Expense").tag(Transaction.TransactionType.expense)
                    Text("Income").tag(Transaction.TransactionType.income)
                }
                Picker("Frequency", selection: $frequency) {
                    Text("Daily").tag(RecurringTransaction.Frequency.daily)
                    Text("Weekly").tag(RecurringTransaction.Frequency.weekly)
                    Text("Monthly").tag(RecurringTransaction.Frequency.monthly)
                    Text("Yearly").tag(RecurringTransaction.Frequency.yearly)
                }
                DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                
                Section {
                    Button("Delete Recurring Transaction", role: .destructive) {
                        showingDeleteAlert = true
                    }
                }
            }
            .navigationTitle("Edit Recurring Transaction")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveRecurringTransaction()
                    }
                    .disabled(isSaving || name.isEmpty || amount.isEmpty || category.isEmpty)
                }
            }
            .alert("Delete Recurring Transaction", isPresented: $showingDeleteAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    deleteRecurringTransaction()
                }
            } message: {
                Text("Are you sure you want to delete this recurring transaction? This action cannot be undone.")
            }
        }
        .toast(message: $toastMessage)
    }
    
    private func saveRecurringTransaction() {
        guard let amountValue = Double(amount), amountValue > 0 else {
            errorMessage = "Please enter a valid amount"
            return
        }
        
        guard !name.isEmpty, !category.isEmpty else {
            errorMessage = "Please fill in all required fields"
            return
        }
        
        isSaving = true
        errorMessage = nil
        
        let calendar = Calendar.current
        var nextDate = startDate
        switch frequency {
        case .daily:
            nextDate = calendar.date(byAdding: .day, value: 1, to: startDate) ?? startDate
        case .weekly:
            nextDate = calendar.date(byAdding: .day, value: 7, to: startDate) ?? startDate
        case .biweekly:
            nextDate = calendar.date(byAdding: .day, value: 14, to: startDate) ?? startDate
        case .monthly:
            nextDate = calendar.date(byAdding: .month, value: 1, to: startDate) ?? startDate
        case .yearly:
            nextDate = calendar.date(byAdding: .year, value: 1, to: startDate) ?? startDate
        }
        
        let updated = RecurringTransaction(
            name: name,
            amount: amountValue,
            category: category,
            type: type,
            frequency: frequency,
            nextDate: nextDate
        )
        
        Task {
            do {
                try await dataService.deleteRecurringTransaction(transaction)
                try await dataService.saveRecurringTransaction(updated)
                HapticFeedback.success()
                toastMessage = "Recurring transaction updated"
                await MainActor.run {
                    isSaving = false
                    dismiss()
                }
            } catch {
                HapticFeedback.error()
                await MainActor.run {
                    isSaving = false
                    errorMessage = "Failed to update: \(error.localizedDescription)"
                }
            }
        }
    }
    
    private func deleteRecurringTransaction() {
        Task {
            do {
                try await dataService.deleteRecurringTransaction(transaction)
                HapticFeedback.success()
                toastMessage = "Recurring transaction deleted"
                await MainActor.run {
                    dismiss()
                }
            } catch {
                HapticFeedback.error()
                await MainActor.run {
                    errorMessage = "Failed to delete: \(error.localizedDescription)"
                }
            }
        }
    }
}
