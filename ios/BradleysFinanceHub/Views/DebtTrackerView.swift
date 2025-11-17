//
//  DebtTrackerView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct DebtTrackerView: View {
    @EnvironmentObject var dataService: DataService
    @State private var debts: [Debt] = []
    @State private var isLoading = true
    @State private var showingAddDebt = false
    
    var body: some View {
        NavigationView {
            List {
                ForEach(debts) { debt in
                    DebtRowView(debt: debt)
                }
                .onDelete(perform: deleteDebt)
            }
            .navigationTitle("Debts")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddDebt = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddDebt) {
                AddDebtView(dataService: dataService)
            }
            .task {
                await loadDebts()
            }
        }
    }
    
    private func loadDebts() async {
        do {
            debts = try await dataService.fetchDebts()
            isLoading = false
        } catch {
            print("Error loading debts: \(error)")
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
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(debt.name)
                .font(.headline)
            Text("Balance: $\(String(format: "%.2f", debt.balance))")
                .font(.subheadline)
                .foregroundColor(.secondary)
            Text("Interest: \(String(format: "%.2f", debt.interestRate))%")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct AddDebtView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    @State private var name = ""
    @State private var balance = ""
    @State private var interestRate = ""
    @State private var minimumPayment = ""
    
    var body: some View {
        NavigationView {
            Form {
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
                }
            }
        }
    }
    
    private func saveDebt() {
        guard let balanceValue = Double(balance),
              let interestValue = Double(interestRate),
              let minPaymentValue = Double(minimumPayment) else { return }
        
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
            try? await dataService.saveDebt(debt)
            dismiss()
        }
    }
}

