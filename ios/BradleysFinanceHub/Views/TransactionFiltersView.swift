//
//  TransactionFiltersView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct TransactionFiltersView: View {
    @Binding var selectedCategory: String?
    @Binding var selectedType: Transaction.TransactionType?
    @Binding var dateRange: DateRange?
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            Form {
                Section("Category") {
                    Picker("Category", selection: $selectedCategory) {
                        Text("All").tag(nil as String?)
                        Text("Food").tag("Food" as String?)
                        Text("Transportation").tag("Transportation" as String?)
                        Text("Entertainment").tag("Entertainment" as String?)
                    }
                }
                
                Section("Type") {
                    Picker("Type", selection: $selectedType) {
                        Text("All").tag(nil as Transaction.TransactionType?)
                        Text("Income").tag(Transaction.TransactionType.income as Transaction.TransactionType?)
                        Text("Expense").tag(Transaction.TransactionType.expense as Transaction.TransactionType?)
                    }
                }
            }
            .navigationTitle("Filters")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

struct DateRange {
    let start: Date
    let end: Date
}

