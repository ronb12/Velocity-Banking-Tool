//
//  BudgetView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct BudgetView: View {
    @EnvironmentObject var dataService: DataService
    @State private var budgets: [Budget] = []
    @State private var isLoading = true
    @State private var showingAddBudget = false
    
    var body: some View {
        NavigationView {
            List {
                ForEach(budgets) { budget in
                    BudgetRowView(budget: budget)
                }
                .onDelete(perform: deleteBudget)
            }
            .navigationTitle("Budgets")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddBudget = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddBudget) {
                AddBudgetView(dataService: dataService)
            }
            .task {
                await loadBudgets()
            }
        }
    }
    
    private func loadBudgets() async {
        do {
            budgets = try await dataService.fetchBudgets()
            isLoading = false
        } catch {
            print("Error loading budgets: \(error)")
            isLoading = false
        }
    }
    
    private func deleteBudget(at offsets: IndexSet) {
        for index in offsets {
            let budget = budgets[index]
            Task {
                try? await dataService.deleteBudget(budget)
                await loadBudgets()
            }
        }
    }
}

struct BudgetRowView: View {
    let budget: Budget
    
    var progress: Double {
        min(budget.spentAmount / budget.budgetedAmount, 1.0)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(budget.category)
                    .font(.headline)
                Spacer()
                Text("$\(String(format: "%.2f", budget.spentAmount)) / $\(String(format: "%.2f", budget.budgetedAmount))")
                    .font(.subheadline)
            }
            ProgressView(value: progress)
                .tint(progress > 0.8 ? .red : .blue)
        }
        .padding(.vertical, 4)
    }
}

struct AddBudgetView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    @State private var category = ""
    @State private var budgetedAmount = ""
    @State private var month = Date()
    
    var body: some View {
        NavigationView {
            Form {
                TextField("Category", text: $category)
                TextField("Budgeted Amount", text: $budgetedAmount)
                    .keyboardType(.decimalPad)
                DatePicker("Month", selection: $month, displayedComponents: .date)
            }
            .navigationTitle("Add Budget")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveBudget()
                    }
                }
            }
        }
    }
    
    private func saveBudget() {
        guard let amount = Double(budgetedAmount) else { return }
        
        let budget = Budget(
            id: UUID().uuidString,
            category: category,
            budgetedAmount: amount,
            spentAmount: 0,
            month: month,
            alertThresholds: [80, 100],
            createdAt: Date()
        )
        
        Task {
            try? await dataService.saveBudget(budget)
            dismiss()
        }
    }
}

