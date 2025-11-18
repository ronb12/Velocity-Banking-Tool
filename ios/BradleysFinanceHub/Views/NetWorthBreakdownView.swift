//
//  NetWorthBreakdownView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct NetWorthBreakdownView: View {
    @EnvironmentObject var dataService: DataService
    @State private var assets: [NetWorthCategory] = []
    @State private var liabilities: [NetWorthCategory] = []
    @State private var isLoading = true
    @State private var showingAddCategory = false
    @State private var isAddingAsset = true
    @State private var editingCategory: NetWorthCategory?
    @State private var isEditingAsset = true
    
    var totalAssets: Double {
        assets.reduce(0) { $0 + $1.amount }
    }
    
    var totalLiabilities: Double {
        liabilities.reduce(0) { $0 + $1.amount }
    }
    
    var body: some View {
        NavigationView {
            contentView
            .navigationTitle("Net Worth Breakdown")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: {
                            isAddingAsset = true
                            showingAddCategory = true
                        }) {
                            Label("Add Asset", systemImage: "plus.circle.fill")
                        }
                        Button(action: {
                            isAddingAsset = false
                            showingAddCategory = true
                        }) {
                            Label("Add Liability", systemImage: "minus.circle.fill")
                        }
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddCategory) {
                AddNetWorthCategoryView(
                    isAsset: isAddingAsset,
                    onSave: {
                        Task {
                            await loadNetWorthData()
                        }
                    }
                )
                .environmentObject(dataService)
            }
            .sheet(item: $editingCategory) { category in
                EditNetWorthCategoryView(
                    category: category,
                    isAsset: isEditingAsset,
                    onSave: {
                        Task {
                            await loadNetWorthData()
                        }
                    },
                    onDelete: {
                        Task {
                            await loadNetWorthData()
                        }
                    }
                )
                .environmentObject(dataService)
            }
            .task {
                await loadNetWorthData()
            }
        }
    }
    
    @ViewBuilder
    private var contentView: some View {
        if isLoading {
            ProgressView()
        } else if assets.isEmpty && liabilities.isEmpty {
            emptyStateView
        } else {
            netWorthList
        }
    }
    
    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "chart.pie.fill")
                .font(.system(size: 50))
                .foregroundColor(.secondary)
            Text("No Net Worth Data")
                .font(.headline)
                .foregroundColor(.secondary)
            Text("Tap the + button to add assets or liabilities")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var netWorthList: some View {
        List {
                        Section("Assets") {
                            ForEach(assets) { asset in
                                HStack {
                                    Text(asset.name)
                                    Spacer()
                                    Text("$\(String(format: "%.2f", asset.amount))")
                                        .foregroundColor(.green)
                                }
                                .onTapGesture {
                                    editingCategory = asset
                                    isEditingAsset = true
                                }
                            }
                            .onDelete { offsets in
                                deleteCategories(at: offsets, from: &assets)
                            }
                            HStack {
                                Text("Total Assets")
                                    .fontWeight(.bold)
                                Spacer()
                                Text("$\(String(format: "%.2f", totalAssets))")
                                    .fontWeight(.bold)
                                    .foregroundColor(.green)
                            }
                        }
                        
                        Section("Liabilities") {
                            ForEach(liabilities) { liability in
                                HStack {
                                    Text(liability.name)
                                    Spacer()
                                    Text("$\(String(format: "%.2f", liability.amount))")
                                        .foregroundColor(.red)
                                }
                                .onTapGesture {
                                    editingCategory = liability
                                    isEditingAsset = false
                                }
                            }
                            .onDelete { offsets in
                                deleteCategories(at: offsets, from: &liabilities)
                            }
                            HStack {
                                Text("Total Liabilities")
                                    .fontWeight(.bold)
                                Spacer()
                                Text("$\(String(format: "%.2f", totalLiabilities))")
                                    .fontWeight(.bold)
                                    .foregroundColor(.red)
                            }
                        }
                        
                        Section("Net Worth") {
                            HStack {
                                Text("Total")
                                    .fontWeight(.bold)
                                Spacer()
                                Text("$\(String(format: "%.2f", totalAssets - totalLiabilities))")
                                    .fontWeight(.bold)
                                    .foregroundColor(totalAssets - totalLiabilities >= 0 ? .green : .red)
                            }
                        }
                    }
    }
    
    private func loadNetWorthData() async {
        do {
            async let transactions = dataService.fetchTransactions()
            async let debts = dataService.fetchDebts()
            async let savingsGoals = dataService.fetchSavingsGoals()
            
            let t = try await transactions
            let d = try await debts
            let s = try await savingsGoals
            
            // Calculate assets from transactions and savings
            let totalIncome = t.filter { $0.type == .income }.reduce(0) { $0 + $1.amount }
            let totalExpenses = t.filter { $0.type == .expense }.reduce(0) { $0 + $1.amount }
            let totalSavings = s.reduce(0) { $0 + $1.currentAmount }
            
            // Create asset categories
            var assetCategories: [NetWorthCategory] = []
            if totalIncome - totalExpenses > 0 {
                assetCategories.append(NetWorthCategory(name: "Cash Flow", type: .asset, amount: totalIncome - totalExpenses))
            }
            if totalSavings > 0 {
                assetCategories.append(NetWorthCategory(name: "Savings", type: .asset, amount: totalSavings))
            }
            assets = assetCategories
            
            // Create liability categories from debts
            liabilities = d.map { debt in
                NetWorthCategory(name: debt.name, type: .liability, amount: debt.balance)
            }
            
            isLoading = false
        } catch {
            print("Error loading net worth data: \(error)")
            isLoading = false
        }
    }
    
    private func deleteCategories(at offsets: IndexSet, from categories: inout [NetWorthCategory]) {
        categories.remove(atOffsets: offsets)
        // Note: In a real app, you'd also delete from dataService here
    }
}

struct EditNetWorthCategoryView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var dataService: DataService
    let category: NetWorthCategory
    let isAsset: Bool
    let onSave: () -> Void
    let onDelete: () -> Void
    
    @State private var name: String
    @State private var amountText: String
    @State private var isSaving = false
    @State private var showingDeleteAlert = false
    
    init(category: NetWorthCategory, isAsset: Bool, onSave: @escaping () -> Void, onDelete: @escaping () -> Void) {
        self.category = category
        self.isAsset = isAsset
        self.onSave = onSave
        self.onDelete = onDelete
        _name = State(initialValue: category.name)
        _amountText = State(initialValue: String(format: "%.2f", category.amount))
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section(isAsset ? "Asset Details" : "Liability Details") {
                    TextField("Name", text: $name)
                    TextField("Amount", text: $amountText)
                        .keyboardType(.decimalPad)
                }
                
                Section {
                    Button("Delete \(isAsset ? "Asset" : "Liability")", role: .destructive) {
                        showingDeleteAlert = true
                    }
                }
            }
            .navigationTitle("Edit \(isAsset ? "Asset" : "Liability")")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveCategory()
                    }
                    .disabled(name.isEmpty || amountText.isEmpty || isSaving)
                }
            }
            .alert("Delete \(isAsset ? "Asset" : "Liability")", isPresented: $showingDeleteAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    deleteCategory()
                }
            } message: {
                Text("Are you sure you want to delete '\(category.name)'? This action cannot be undone.")
            }
        }
    }
    
    private func saveCategory() {
        guard Double(amountText) != nil else { return }
        isSaving = true
        
        Task {
            // Update in Core Data
            // Implementation would go here
            await MainActor.run {
                isSaving = false
                onSave()
                dismiss()
            }
        }
    }
    
    private func deleteCategory() {
        Task {
            // Delete from Core Data
            // Implementation would go here
            await MainActor.run {
                onDelete()
                dismiss()
            }
        }
    }
}

struct AddNetWorthCategoryView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var dataService: DataService
    let isAsset: Bool
    let onSave: () -> Void
    
    @State private var name = ""
    @State private var amountText = ""
    @State private var isSaving = false
    
    var body: some View {
        NavigationView {
            Form {
                Section(isAsset ? "Asset Details" : "Liability Details") {
                    TextField("Name", text: $name)
                    TextField("Amount", text: $amountText)
                        .keyboardType(.decimalPad)
                }
            }
            .navigationTitle(isAsset ? "Add Asset" : "Add Liability")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveCategory()
                    }
                    .disabled(name.isEmpty || amountText.isEmpty || isSaving)
                }
            }
        }
    }
    
    private func saveCategory() {
        guard Double(amountText) != nil else { return }
        isSaving = true
        
        Task {
            // Save to Core Data
            // Implementation would go here
            await MainActor.run {
                isSaving = false
                onSave()
                dismiss()
            }
        }
    }
}

