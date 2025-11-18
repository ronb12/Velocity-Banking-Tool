//
//  DebtTrackerView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct DebtTrackerView: View {
    @EnvironmentObject var dataService: DataService
    @State private var showingAddDebt = false
    
    var body: some View {
        NavigationView {
            DebtTrackerViewContent(showingAddDebt: $showingAddDebt)
                .environmentObject(dataService)
        }
    }
}

struct DebtTrackerViewContent: View {
    @EnvironmentObject var dataService: DataService
    @Binding var showingAddDebt: Bool
    @State private var debts: [Debt] = []
    @State private var isLoading = true
    @State private var editingDebt: Debt?
    @State private var loadTask: Task<Void, Never>?
    
    var body: some View {
        ScrollView {
            Group {
                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, minHeight: 200)
                } else if debts.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "creditcard")
                            .font(.system(size: 50))
                            .foregroundColor(.secondary)
                        Text("No Debts Tracked")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        Text("Tap the + button to add a debt to track")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, minHeight: 200)
                    .padding()
                } else {
                    VStack(spacing: 12) {
                        ForEach(debts) { debt in
                            DebtRowView(debt: debt)
                                .onTapGesture {
                                    editingDebt = debt
                                }
                        }
                    }
                    .padding()
                }
            }
        }
            .sheet(isPresented: $showingAddDebt) {
                AddDebtView(dataService: dataService)
                    .onDisappear {
                        refreshDebts()
                    }
            }
            .sheet(item: $editingDebt) { debt in
                EditDebtView(dataService: dataService, debt: debt)
                    .onDisappear {
                        refreshDebts()
                    }
            }
            .task {
                await loadDebts()
            }
            .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("DemoDataLoaded"))) { _ in
                Task {
                    try? await Task.sleep(nanoseconds: 500_000_000)
                    await loadDebts()
                }
            }
            .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("SavingsGoalCreated"))) { _ in
                refreshDebts()
            }
            .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("GoalsTabChanged"))) { _ in
                refreshDebts()
            }
            .onDisappear {
                loadTask?.cancel()
            }
    }
    
    private func refreshDebts() {
        loadTask?.cancel()
        loadTask = Task { @MainActor in
            await performLoadDebts()
        }
    }
    
    private func loadDebts() async {
        loadTask?.cancel()
        loadTask = Task { @MainActor in
            await performLoadDebts()
        }
        await loadTask?.value
    }
    
    private func performLoadDebts() async {
        do {
            print("📊 DebtTrackerView: Loading debts...")
            let fetchedDebts = try await dataService.fetchDebts()
            print("📊 DebtTrackerView: Fetched \(fetchedDebts.count) debts")
            
            // Check if task was cancelled
            try Task.checkCancellation()
            
            debts = fetchedDebts
            isLoading = false
        } catch {
            if error is CancellationError {
                return
            }
            print("❌ Error loading debts: \(error)")
            isLoading = false
        }
    }
    
    private func deleteDebt(at offsets: IndexSet) {
        for index in offsets {
            let debt = debts[index]
            Task {
                try? await dataService.deleteDebt(debt)
                await loadDebts()
            }
        }
    }
}

struct DebtRowView: View {
    let debt: Debt
    
    var daysUntilDue: Int {
        guard let dueDate = debt.dueDate else { return 0 }
        let calendar = Calendar.current
        let components = calendar.dateComponents([.day], from: Date(), to: dueDate)
        return components.day ?? 0
    }
    
    var isOverdue: Bool {
        guard let dueDate = debt.dueDate else { return false }
        return dueDate < Date()
    }
    
    var urgencyColor: Color {
        if isOverdue {
            return .red
        } else if daysUntilDue <= 7 {
            return .orange
        } else {
            return .blue
        }
    }
    
    var body: some View {
        HStack(spacing: 16) {
            // Urgency indicator
            ZStack {
                Circle()
                    .fill(urgencyColor.opacity(0.2))
                    .frame(width: 50, height: 50)
                Image(systemName: isOverdue ? "exclamationmark.triangle.fill" : "creditcard.fill")
                    .foregroundColor(urgencyColor)
                    .font(.title3)
            }
            
            // Debt info
            VStack(alignment: .leading, spacing: 6) {
                Text(debt.name)
                    .font(.headline)
                
                HStack {
                    Text("$\(String(format: "%.2f", debt.balance))")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(urgencyColor)
                    Text("•")
                        .foregroundColor(.secondary)
                    Text("\(String(format: "%.2f", debt.interestRate))% APR")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                if debt.dueDate != nil {
                    HStack {
                        if isOverdue {
                            Text("Overdue")
                                .font(.caption)
                                .foregroundColor(.red)
                                .fontWeight(.semibold)
                        } else {
                            Text("Due in \(daysUntilDue) days")
                                .font(.caption)
                                .foregroundColor(daysUntilDue <= 7 ? .orange : .secondary)
                        }
                        Text("•")
                            .foregroundColor(.secondary)
                        Text("Min: $\(String(format: "%.2f", debt.minimumPayment))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Spacer()
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct AddDebtView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    @State private var name = ""
    @State private var balance = ""
    @State private var interestRate = ""
    @State private var minimumPayment = ""
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
                TextField("Name", text: $name)
                TextField("Balance", text: $balance)
                    .keyboardType(.decimalPad)
                TextField("Interest Rate", text: $interestRate)
                    .keyboardType(.decimalPad)
                TextField("Minimum Payment", text: $minimumPayment)
                    .keyboardType(.decimalPad)
            }
            .navigationTitle("Add Debt")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveDebt()
                    }
                    .disabled(isSaving || name.isEmpty || balance.isEmpty || interestRate.isEmpty || minimumPayment.isEmpty)
                }
            }
        }
    }
    
    private func saveDebt() {
        guard let balanceValue = Double(balance), balanceValue >= 0,
              let interestValue = Double(interestRate), interestValue >= 0,
              let minPaymentValue = Double(minimumPayment), minPaymentValue >= 0 else {
            errorMessage = "Please enter valid numbers"
            return
        }
        
        guard !name.isEmpty else {
            errorMessage = "Please enter a name"
            return
        }
        
        isSaving = true
        errorMessage = nil
        
        let debt = Debt(
            id: UUID().uuidString,
            name: name,
            balance: balanceValue,
            interestRate: interestValue,
            minimumPayment: minPaymentValue,
            dueDate: Date(),
            createdAt: Date()
        )
        
        Task {
            do {
                try await dataService.saveDebt(debt)
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

struct EditDebtView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    let debt: Debt
    @State private var name: String
    @State private var balance: String
    @State private var interestRate: String
    @State private var minimumPayment: String
    @State private var dueDate: Date
    @State private var isSaving = false
    @State private var errorMessage: String?
    
    init(dataService: DataService, debt: Debt) {
        self.dataService = dataService
        self.debt = debt
        _name = State(initialValue: debt.name)
        _balance = State(initialValue: String(format: "%.2f", debt.balance))
        _interestRate = State(initialValue: String(format: "%.2f", debt.interestRate))
        _minimumPayment = State(initialValue: String(format: "%.2f", debt.minimumPayment))
        _dueDate = State(initialValue: debt.dueDate ?? Date())
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
                TextField("Balance", text: $balance)
                    .keyboardType(.decimalPad)
                TextField("Interest Rate", text: $interestRate)
                    .keyboardType(.decimalPad)
                TextField("Minimum Payment", text: $minimumPayment)
                    .keyboardType(.decimalPad)
                DatePicker("Due Date", selection: $dueDate, displayedComponents: .date)
            }
            .navigationTitle("Edit Debt")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveDebt()
                    }
                    .disabled(isSaving || name.isEmpty || balance.isEmpty || interestRate.isEmpty || minimumPayment.isEmpty)
                }
            }
        }
    }
    
    private func saveDebt() {
        guard let balanceValue = Double(balance), balanceValue >= 0,
              let interestValue = Double(interestRate), interestValue >= 0,
              let minPaymentValue = Double(minimumPayment), minPaymentValue >= 0 else {
            errorMessage = "Please enter valid numbers"
            return
        }
        
        guard !name.isEmpty else {
            errorMessage = "Please enter a name"
            return
        }
        
        isSaving = true
        errorMessage = nil
        
        var updatedDebt = debt
        updatedDebt.name = name
        updatedDebt.balance = balanceValue
        updatedDebt.interestRate = interestValue
        updatedDebt.minimumPayment = minPaymentValue
        updatedDebt.dueDate = dueDate
        
        Task {
            do {
                try await dataService.saveDebt(updatedDebt)
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

