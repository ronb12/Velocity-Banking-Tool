//
//  ZeroBasedBudgetView.swift
//  BradleysFinanceHub
//
//  Zero-based budgeting implementation (YNAB-style)
//

import SwiftUI

struct ZeroBasedBudgetView: View {
    @EnvironmentObject var dataService: DataService
    @State private var monthlyIncome: Double = 0
    @State private var categories: [ZeroBasedCategory] = []
    @State private var showingAddCategory = false
    @State private var selectedMonth: Date = Date()
    
    var totalBudgeted: Double {
        categories.reduce(0) { $0 + $1.budgeted }
    }
    
    var availableToBudget: Double {
        monthlyIncome - totalBudgeted
    }
    
    var totalSpent: Double {
        categories.reduce(0) { $0 + $1.spent }
    }
    
    var body: some View {
        ScrollView {
                VStack(spacing: 20) {
                    // Month Selector
                    MonthSelector(selectedMonth: $selectedMonth)
                    
                    // Income Card
                    IncomeCard(
                        monthlyIncome: $monthlyIncome,
                        availableToBudget: availableToBudget
                    )
                    
                    // Available to Budget Warning
                    if availableToBudget < 0 {
                        WarningCard(
                            message: "You've budgeted more than your income!",
                            amount: abs(availableToBudget)
                        )
                    } else if availableToBudget > 0 {
                        InfoCard(
                            message: "Available to Budget",
                            amount: availableToBudget
                        )
                    } else {
                        SuccessCard(message: "Every dollar has a job! ✅")
                    }
                    
                    // Categories
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Categories")
                                .font(.headline)
                            Spacer()
                            Text("$\(String(format: "%.2f", totalBudgeted)) / $\(String(format: "%.2f", monthlyIncome))")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .padding(.horizontal)
                        
                        ForEach(categories) { category in
                            ZeroBasedCategoryRow(
                                category: category,
                                onEdit: { editedCategory in
                                    if let index = categories.firstIndex(where: { $0.id == editedCategory.id }) {
                                        categories[index] = editedCategory
                                        saveBudget()
                                    }
                                },
                                onDelete: {
                                    categories.removeAll { $0.id == category.id }
                                    saveBudget()
                                }
                            )
                            .padding(.horizontal)
                        }
                    }
                    
                    // Quick Assign
                    if availableToBudget > 0 {
                        QuickAssignCard(
                            availableToBudget: availableToBudget,
                            categories: $categories
                        )
                    }
                }
                .padding()
            }
        }
        .navigationTitle("Zero-Based Budget")
        .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { showingAddCategory = true }) {
                            Label("Add Category", systemImage: "plus")
                        }
                    Button(action: { 
                        assignAllAvailable()
                        saveBudget()
                    }) {
                        Label("Assign All Available", systemImage: "checkmark.circle")
                    }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $showingAddCategory) {
                AddZeroBasedCategoryView(categories: $categories)
                    .onDisappear {
                        saveBudget()
                    }
            }
            .task {
                await loadBudget()
            }
            .onChange(of: selectedMonth) { oldValue, newValue in
                Task {
                    await loadSpentAmounts()
                }
            }
            .onChange(of: categories) { oldValue, newValue in
                saveBudget()
            }
        }
    }
    
    private func loadBudget() async {
        // Load zero-based budget from UserDefaults
        if let savedIncome = UserDefaults.standard.object(forKey: "zeroBasedMonthlyIncome") as? Double {
            monthlyIncome = savedIncome
        }
        
        if let categoriesData = UserDefaults.standard.data(forKey: "zeroBasedCategories"),
           let decoded = try? JSONDecoder().decode([ZeroBasedCategory].self, from: categoriesData) {
            categories = decoded
        }
        
        // Load spent amounts from transactions
        await loadSpentAmounts()
    }
    
    private func loadSpentAmounts() async {
        do {
            let transactions = try await dataService.fetchTransactions()
            let calendar = Calendar.current
            let monthStart = calendar.date(from: calendar.dateComponents([.year, .month], from: selectedMonth)) ?? selectedMonth
            
            // Calculate spent per category for the selected month
            for index in categories.indices {
                let categoryName = categories[index].name
                let spent = transactions
                    .filter { transaction in
                        let transactionMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: transaction.date)) ?? transaction.date
                        return transaction.type == .expense &&
                               transaction.category == categoryName &&
                               transactionMonth == monthStart
                    }
                    .reduce(0) { $0 + $1.amount }
                
                categories[index].spent = spent
            }
        } catch {
            print("Error loading spent amounts: \(error)")
        }
    }
    
    private func saveBudget() {
        // Save to UserDefaults
        UserDefaults.standard.set(monthlyIncome, forKey: "zeroBasedMonthlyIncome")
        
        if let encoded = try? JSONEncoder().encode(categories) {
            UserDefaults.standard.set(encoded, forKey: "zeroBasedCategories")
        }
    }
    
    private func assignAllAvailable() {
        if availableToBudget > 0 && !categories.isEmpty {
            let perCategory = availableToBudget / Double(categories.count)
            for index in categories.indices {
                categories[index].budgeted += perCategory
            }
        }
    }
}

struct ZeroBasedCategory: Identifiable, Codable {
    let id: String
    var name: String
    var budgeted: Double
    var spent: Double
    var available: Double {
        budgeted - spent
    }
    
    init(id: String = UUID().uuidString, name: String, budgeted: Double = 0, spent: Double = 0) {
        self.id = id
        self.name = name
        self.budgeted = budgeted
        self.spent = spent
    }
}

struct MonthSelector: View {
    @Binding var selectedMonth: Date
    
    var body: some View {
        HStack {
            Button(action: { changeMonth(-1) }) {
                Image(systemName: "chevron.left")
            }
            
            Spacer()
            
            Text(selectedMonth, format: .dateTime.month().year())
                .font(.headline)
            
            Spacer()
            
            Button(action: { changeMonth(1) }) {
                Image(systemName: "chevron.right")
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    private func changeMonth(_ direction: Int) {
        if let newDate = Calendar.current.date(byAdding: .month, value: direction, to: selectedMonth) {
            selectedMonth = newDate
        }
    }
}

struct IncomeCard: View {
    @Binding var monthlyIncome: Double
    let availableToBudget: Double
    
    var body: some View {
        VStack(spacing: 12) {
            Text("Monthly Income")
                .font(.headline)
                .foregroundColor(.secondary)
            
            TextField("Income", value: $monthlyIncome, format: .currency(code: "USD"))
                .font(.system(size: 32, weight: .bold))
                .multilineTextAlignment(.center)
                .keyboardType(.decimalPad)
                .onChange(of: monthlyIncome) { oldValue, newValue in
                    saveBudget()
                }
            
            Divider()
            
            HStack {
                VStack(alignment: .leading) {
                    Text("Available to Budget")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("$\(String(format: "%.2f", availableToBudget))")
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(availableToBudget >= 0 ? .green : .red)
                }
                
                Spacer()
            }
        }
        .padding()
        .background(
            LinearGradient(
                gradient: Gradient(colors: [Color.green.opacity(0.1), Color.blue.opacity(0.1)]),
                startPoint: .leading,
                endPoint: .trailing
            )
        )
        .cornerRadius(16)
    }
}

struct WarningCard: View {
    let message: String
    let amount: Double
    
    var body: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.orange)
            Text(message)
                .font(.subheadline)
            Spacer()
            Text("-$\(String(format: "%.2f", amount))")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.red)
        }
        .padding()
        .background(Color.orange.opacity(0.1))
        .cornerRadius(12)
    }
}

struct InfoCard: View {
    let message: String
    let amount: Double
    
    var body: some View {
        HStack {
            Image(systemName: "info.circle.fill")
                .foregroundColor(.blue)
            Text(message)
                .font(.subheadline)
            Spacer()
            Text("$\(String(format: "%.2f", amount))")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.green)
        }
        .padding()
        .background(Color.blue.opacity(0.1))
        .cornerRadius(12)
    }
}

struct SuccessCard: View {
    let message: String
    
    var body: some View {
        HStack {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)
            Text(message)
                .font(.subheadline)
            Spacer()
        }
        .padding()
        .background(Color.green.opacity(0.1))
        .cornerRadius(12)
    }
}

struct ZeroBasedCategoryRow: View {
    let category: ZeroBasedCategory
    let onEdit: (ZeroBasedCategory) -> Void
    let onDelete: () -> Void
    @State private var showingEditSheet = false
    @State private var showingDeleteAlert = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(category.name)
                    .font(.headline)
                Spacer()
                Text("$\(String(format: "%.2f", category.available))")
                    .font(.headline)
                    .foregroundColor(category.available >= 0 ? .green : .red)
                
                Menu {
                    Button(action: { showingEditSheet = true }) {
                        Label("Edit", systemImage: "pencil")
                    }
                    Button(role: .destructive, action: { showingDeleteAlert = true }) {
                        Label("Delete", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .foregroundColor(.secondary)
                }
            }
            
            // Budgeted vs Spent
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Budgeted")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Button(action: { showingEditSheet = true }) {
                        Text("$\(String(format: "%.2f", category.budgeted))")
                            .font(.subheadline)
                            .foregroundColor(.blue)
                    }
                }
                
                Spacer()
                
                VStack(alignment: .center, spacing: 4) {
                    Text("Spent")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("$\(String(format: "%.2f", category.spent))")
                        .font(.subheadline)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Available")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("$\(String(format: "%.2f", category.available))")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(category.available >= 0 ? .green : .red)
                }
            }
            
            // Progress Bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 8)
                        .cornerRadius(4)
                    
                    if category.budgeted > 0 {
                        let spentRatio = min(category.spent / category.budgeted, 1.0)
                        Rectangle()
                            .fill(spentRatio >= 1.0 ? Color.red : Color.green)
                            .frame(width: geometry.size.width * spentRatio, height: 8)
                            .cornerRadius(4)
                    }
                }
            }
            .frame(height: 8)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .sheet(isPresented: $showingEditSheet) {
            EditZeroBasedCategoryView(
                category: category,
                onSave: { editedCategory in
                    onEdit(editedCategory)
                    showingEditSheet = false
                }
            )
        }
        .alert("Delete Category", isPresented: $showingDeleteAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                onDelete()
            }
        } message: {
            Text("Are you sure you want to delete '\(category.name)'? This action cannot be undone.")
        }
    }
}

struct QuickAssignCard: View {
    let availableToBudget: Double
    @Binding var categories: [ZeroBasedCategory]
    @State private var quickAssignAmount: Double = 0
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Assign")
                .font(.headline)
            
            HStack {
                TextField("Amount", value: $quickAssignAmount, format: .currency(code: "USD"))
                    .keyboardType(.decimalPad)
                
                Button("Assign to First Category") {
                    if !categories.isEmpty && quickAssignAmount > 0 {
                        categories[0].budgeted += quickAssignAmount
                        quickAssignAmount = 0
                        // Save will be handled by parent view's onChange
                    }
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct AddZeroBasedCategoryView: View {
    @Environment(\.dismiss) var dismiss
    @Binding var categories: [ZeroBasedCategory]
    @State private var categoryName = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section("Category Details") {
                    TextField("Category Name", text: $categoryName)
                        .autocapitalization(.words)
                }
            }
            .navigationTitle("Add Category")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        if !categoryName.isEmpty && !categories.contains(where: { $0.name.lowercased() == categoryName.lowercased() }) {
                            categories.append(ZeroBasedCategory(name: categoryName))
                            dismiss()
                        }
                    }
                    .disabled(categoryName.isEmpty)
                }
            }
        }
    }
}

struct EditZeroBasedCategoryView: View {
    @Environment(\.dismiss) var dismiss
    let category: ZeroBasedCategory
    let onSave: (ZeroBasedCategory) -> Void
    @State private var categoryName: String
    @State private var budgetedAmount: Double
    
    init(category: ZeroBasedCategory, onSave: @escaping (ZeroBasedCategory) -> Void) {
        self.category = category
        self.onSave = onSave
        _categoryName = State(initialValue: category.name)
        _budgetedAmount = State(initialValue: category.budgeted)
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section("Category Details") {
                    TextField("Category Name", text: $categoryName)
                        .autocapitalization(.words)
                }
                
                Section("Budget") {
                    TextField("Budgeted Amount", value: $budgetedAmount, format: .currency(code: "USD"))
                        .keyboardType(.decimalPad)
                }
                
                Section {
                    HStack {
                        Text("Spent")
                        Spacer()
                        Text("$\(String(format: "%.2f", category.spent))")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Available")
                        Spacer()
                        Text("$\(String(format: "%.2f", budgetedAmount - category.spent))")
                            .foregroundColor((budgetedAmount - category.spent) >= 0 ? .green : .red)
                    }
                }
            }
            .navigationTitle("Edit Category")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        var editedCategory = category
                        editedCategory.name = categoryName
                        editedCategory.budgeted = budgetedAmount
                        onSave(editedCategory)
                    }
                    .disabled(categoryName.isEmpty)
                }
            }
        }
    }
}

