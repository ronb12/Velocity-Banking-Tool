//
//  BudgetView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct BudgetView: View {
    @EnvironmentObject var dataService: DataService
    
    var body: some View {
        NavigationView {
            BudgetViewContent()
                .environmentObject(dataService)
        }
    }
}

struct BudgetViewContent: View {
    @EnvironmentObject var dataService: DataService
    @State private var budgets: [Budget] = []
    @State private var isLoading = true
    @State private var showingAddBudget = false
    @State private var editingBudget: Budget?
    
    var body: some View {
            Group {
                if isLoading {
                    ProgressView()
                } else if budgets.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "dollarsign.circle")
                            .font(.system(size: 50))
                            .foregroundColor(.secondary)
                        Text("No Budgets Yet")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        Text("Tap the + button to create your first budget")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List {
                        ForEach(budgets) { budget in
                            BudgetRowView(budget: budget)
                                .onTapGesture {
                                    editingBudget = budget
                                }
                        }
                        .onDelete(perform: deleteBudget)
                    }
                }
            }
            .navigationTitle("Budgets")
            // Add budget button is handled by parent MoneyView
            .sheet(item: $editingBudget) { budget in
                EditBudgetView(dataService: dataService, budget: budget)
                    .onDisappear {
                        Task {
                            await loadBudgets()
                        }
                    }
            }
            .task {
                await loadBudgets()
            }
            .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("RefreshBudgets"))) { _ in
                Task {
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
    
    var percentage: Double {
        (budget.spentAmount / budget.budgetedAmount) * 100
    }
    
    var statusColor: Color {
        if percentage >= 100 {
            return .red
        } else if percentage >= 80 {
            return .orange
        } else {
            return .green
        }
    }
    
    var categoryIcon: String {
        switch budget.category.lowercased() {
        case "groceries", "food": return "cart.fill"
        case "dining out", "restaurant": return "fork.knife"
        case "transportation", "gas": return "car.fill"
        case "entertainment": return "tv.fill"
        case "shopping": return "bag.fill"
        case "utilities": return "bolt.fill"
        case "healthcare", "health": return "cross.case.fill"
        default: return "dollarsign.circle.fill"
        }
    }
    
    var body: some View {
        HStack(spacing: 16) {
            // Category Icon
            ZStack {
                Circle()
                    .fill(statusColor.opacity(0.2))
                    .frame(width: 50, height: 50)
                Image(systemName: categoryIcon)
                    .foregroundColor(statusColor)
                    .font(.title3)
            }
            
            // Budget Info
            VStack(alignment: .leading, spacing: 6) {
                Text(budget.category)
                    .font(.headline)
                
                HStack {
                    Text("$\(String(format: "%.2f", budget.spentAmount))")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(statusColor)
                    Text("of")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("$\(String(format: "%.2f", budget.budgetedAmount))")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                // Progress Bar
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color(.systemGray5))
                            .frame(height: 6)
                            .cornerRadius(3)
                        
                        Rectangle()
                            .fill(statusColor)
                            .frame(width: geometry.size.width * progress, height: 6)
                            .cornerRadius(3)
                    }
                }
                .frame(height: 6)
            }
            
            Spacer()
            
            // Percentage Badge
            VStack {
                Text("\(Int(percentage))%")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(statusColor)
                if percentage >= 100 {
                    Text("Over")
                        .font(.caption2)
                        .foregroundColor(.red)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct AddBudgetView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    @State private var category = ""
    @State private var budgetedAmount = ""
    @State private var month = Date()
    @State private var isSaving = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            Form {
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
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
                    .disabled(isSaving || category.isEmpty || budgetedAmount.isEmpty)
                }
            }
        }
    }
    
    private func saveBudget() {
        guard let amount = Double(budgetedAmount), amount > 0 else {
            errorMessage = "Please enter a valid amount"
            return
        }
        
        guard !category.isEmpty else {
            errorMessage = "Please enter a category"
            return
        }
        
        isSaving = true
        errorMessage = nil
        
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
            do {
                try await dataService.saveBudget(budget)
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

struct EditBudgetView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    let budget: Budget
    @State private var category: String
    @State private var budgetedAmount: String
    @State private var month: Date
    @State private var isSaving = false
    @State private var errorMessage: String?
    
    init(dataService: DataService, budget: Budget) {
        self.dataService = dataService
        self.budget = budget
        _category = State(initialValue: budget.category)
        _budgetedAmount = State(initialValue: String(format: "%.2f", budget.budgetedAmount))
        _month = State(initialValue: budget.month)
    }
    
    var body: some View {
        NavigationView {
            Form {
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                TextField("Category", text: $category)
                TextField("Budgeted Amount", text: $budgetedAmount)
                    .keyboardType(.decimalPad)
                DatePicker("Month", selection: $month, displayedComponents: .date)
            }
            .navigationTitle("Edit Budget")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveBudget()
                    }
                    .disabled(isSaving || category.isEmpty || budgetedAmount.isEmpty)
                }
            }
        }
    }
    
    private func saveBudget() {
        guard let amount = Double(budgetedAmount), amount > 0 else {
            errorMessage = "Please enter a valid amount"
            return
        }
        
        guard !category.isEmpty else {
            errorMessage = "Please enter a category"
            return
        }
        
        isSaving = true
        errorMessage = nil
        
        var updatedBudget = budget
        updatedBudget.category = category
        updatedBudget.budgetedAmount = amount
        updatedBudget.month = month
        
        Task {
            do {
                try await dataService.saveBudget(updatedBudget)
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

