//
//  TransactionsView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct TransactionsView: View {
    @EnvironmentObject var dataService: DataService
    
    var body: some View {
        NavigationView {
            TransactionsViewContent()
                .environmentObject(dataService)
        }
    }
}

struct TransactionsViewContent: View {
    @EnvironmentObject var dataService: DataService
    @State private var transactions: [Transaction] = []
    @State private var filteredTransactions: [Transaction] = []
    @State private var isLoading = true
    @State private var showingAddTransaction = false
    @State private var editingTransaction: Transaction?
    @State private var searchText = ""
    @State private var selectedCategory: String?
    @State private var selectedType: Transaction.TransactionType?
    @State private var showingFilters = false
    @State private var toastMessage: String?
    
    var categories: [String] {
        Array(Set(transactions.map { $0.category })).sorted()
    }
    
    var body: some View {
        Group {
            if isLoading {
                ProgressView()
            } else if filteredTransactions.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "list.bullet.rectangle")
                        .font(.system(size: 50))
                        .foregroundColor(.secondary)
                    Text(searchText.isEmpty ? "No Transactions Yet" : "No Results")
                        .font(.headline)
                        .foregroundColor(.secondary)
                    Text(searchText.isEmpty ? "Tap the + button to add your first transaction" : "Try adjusting your search or filters")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List {
                    ForEach(filteredTransactions) { transaction in
                        TransactionRowView(transaction: transaction)
                            .onTapGesture {
                                editingTransaction = transaction
                            }
                    }
                    .onDelete(perform: deleteTransaction)
                }
            }
        }
        .navigationTitle("Transactions")
        .searchable(text: $searchText, prompt: "Search transactions")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingFilters.toggle() }) {
                    Image(systemName: showingFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                }
            }
        }
            .sheet(isPresented: $showingFilters) {
                TransactionFiltersView(
                    categories: categories,
                    selectedCategory: $selectedCategory,
                    selectedType: $selectedType
                )
            }
            // Add transaction sheet is handled by parent MoneyView
            .sheet(item: $editingTransaction) { transaction in
                EditTransactionView(dataService: dataService, transaction: transaction)
                    .onDisappear {
                        Task {
                            await loadTransactions()
                        }
                    }
            }
            .task {
                await loadTransactions()
            }
            .onChange(of: searchText) { oldValue, newValue in
                filterTransactions()
            }
            .onChange(of: selectedCategory) { oldValue, newValue in
                filterTransactions()
            }
            .onChange(of: selectedType) { oldValue, newValue in
                filterTransactions()
            }
            .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("DemoDataLoaded"))) { _ in
                Task {
                    print("TransactionsView: Refreshing after demo data load...")
                    await loadTransactions()
                }
            }
            .toast(message: $toastMessage)
    }
    
    private func loadTransactions() async {
        do {
            transactions = try await dataService.fetchTransactions()
            filterTransactions()
            isLoading = false
        } catch {
            print("Error loading transactions: \(error)")
            isLoading = false
        }
    }
    
    private func filterTransactions() {
        var filtered = transactions
        
        // Search filter
        if !searchText.isEmpty {
            filtered = filtered.filter { transaction in
                transaction.description.localizedCaseInsensitiveContains(searchText) ||
                transaction.category.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        // Category filter
        if let category = selectedCategory {
            filtered = filtered.filter { $0.category == category }
        }
        
        // Type filter
        if let type = selectedType {
            filtered = filtered.filter { $0.type == type }
        }
        
        filteredTransactions = filtered
    }
    
    private func deleteTransaction(at offsets: IndexSet) {
        for index in offsets {
            let transaction = filteredTransactions[index]
            Task {
                do {
                    try await dataService.deleteTransaction(transaction)
                    HapticFeedback.success()
                    toastMessage = "Transaction deleted"
                    await loadTransactions()
                } catch {
                    HapticFeedback.error()
                    toastMessage = "Failed to delete transaction"
                }
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
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var suggestedCategory: String?
    @State private var showCategoryPicker = false
    
    var body: some View {
        NavigationView {
            Form {
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                TextField("Description", text: $description)
                    .onChange(of: description) { oldValue, newValue in
                        // Auto-suggest category when description changes
                        if !newValue.isEmpty {
                            let amountValue = Double(amount) ?? 0
                            if let suggested = AutoCategorizationService.shared.suggestCategory(
                                for: newValue,
                                amount: amountValue,
                                type: type
                            ) {
                                suggestedCategory = suggested
                                if category.isEmpty {
                                    category = suggested
                                }
                            }
                        }
                    }
                TextField("Amount", text: $amount)
                    .keyboardType(.decimalPad)
                HStack {
                    TextField("Category", text: $category)
                    if let suggested = suggestedCategory, suggested != category {
                        Button(action: {
                            category = suggested
                        }) {
                            Text("Use: \(suggested)")
                                .font(.caption)
                                .foregroundColor(.blue)
                        }
                    }
                }
                if showCategoryPicker {
                    Picker("Select Category", selection: $category) {
                        ForEach(AutoCategorizationService.shared.availableCategories(), id: \.self) { cat in
                            Text(cat).tag(cat)
                        }
                    }
                }
                Picker("Type", selection: $type) {
                    Text("Expense").tag(Transaction.TransactionType.expense)
                    Text("Income").tag(Transaction.TransactionType.income)
                }
                .onChange(of: type) { oldValue, newValue in
                    // Re-suggest category when type changes
                    if !description.isEmpty {
                        let amountValue = Double(amount) ?? 0
                        if let suggested = AutoCategorizationService.shared.suggestCategory(
                            for: description,
                            amount: amountValue,
                            type: newValue
                        ) {
                            suggestedCategory = suggested
                            if category.isEmpty {
                                category = suggested
                            }
                        }
                    }
                }
                DatePicker("Date", selection: $date, displayedComponents: .date)
                Button(action: {
                    showCategoryPicker.toggle()
                }) {
                    HStack {
                        Text(showCategoryPicker ? "Hide Categories" : "Show All Categories")
                        Spacer()
                        Image(systemName: showCategoryPicker ? "chevron.up" : "chevron.down")
                    }
                }
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
                    .disabled(isSaving || description.isEmpty || amount.isEmpty || category.isEmpty)
                }
            }
        }
    }
    
    private func saveTransaction() {
        guard let amountValue = Double(amount), amountValue > 0 else {
            errorMessage = "Please enter a valid amount"
            return
        }
        
        guard !description.isEmpty, !category.isEmpty else {
            errorMessage = "Please fill in all fields"
            return
        }
        
        isSaving = true
        errorMessage = nil
        
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
        
        print("🔘 AddTransactionView: Save button tapped")
        print("   Description: \(description)")
        print("   Amount: \(amountValue)")
        print("   Category: \(category)")
        
        Task {
            do {
                print("🔄 AddTransactionView: Calling dataService.saveTransaction...")
                try await dataService.saveTransaction(transaction)
                
                // Learn from user's categorization
                if !category.isEmpty {
                    AutoCategorizationService.shared.learnCategory(description: description, category: category)
                }
                
                print("✅ AddTransactionView: Save completed successfully")
                HapticFeedback.success()
                await MainActor.run {
                    isSaving = false
                    dismiss()
                }
            } catch {
                print("❌ AddTransactionView: Save failed with error: \(error.localizedDescription)")
                await MainActor.run {
                    isSaving = false
                    errorMessage = "Failed to save: \(error.localizedDescription)"
                }
            }
        }
    }
}

struct EditTransactionView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    let transaction: Transaction
    @State private var description: String
    @State private var amount: String
    @State private var category: String
    @State private var type: Transaction.TransactionType
    @State private var date: Date
    @State private var isSaving = false
    @State private var errorMessage: String?
    
    init(dataService: DataService, transaction: Transaction) {
        self.dataService = dataService
        self.transaction = transaction
        _description = State(initialValue: transaction.description)
        _amount = State(initialValue: String(format: "%.2f", transaction.amount))
        _category = State(initialValue: transaction.category)
        _type = State(initialValue: transaction.type)
        _date = State(initialValue: transaction.date)
    }
    
    var body: some View {
        NavigationView {
            Form {
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
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
            .navigationTitle("Edit Transaction")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveTransaction()
                    }
                    .disabled(isSaving || description.isEmpty || amount.isEmpty || category.isEmpty)
                }
            }
        }
    }
    
    private func saveTransaction() {
        guard let amountValue = Double(amount), amountValue > 0 else {
            errorMessage = "Please enter a valid amount"
            return
        }
        
        guard !description.isEmpty, !category.isEmpty else {
            errorMessage = "Please fill in all fields"
            return
        }
        
        isSaving = true
        errorMessage = nil
        
        var updatedTransaction = transaction
        updatedTransaction.description = description
        updatedTransaction.amount = amountValue
        updatedTransaction.category = category
        updatedTransaction.type = type
        updatedTransaction.date = date
        
        Task {
            do {
                try await dataService.saveTransaction(updatedTransaction)
                await MainActor.run {
                    isSaving = false
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isSaving = false
                    errorMessage = "Failed to save: \(error.localizedDescription)"
                }
            }
        }
    }
}

