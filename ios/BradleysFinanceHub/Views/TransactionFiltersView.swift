//
//  TransactionFiltersView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct TransactionFiltersView: View {
    let categories: [String]
    @Binding var selectedCategory: String?
    @Binding var selectedType: Transaction.TransactionType?
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            Form {
                Section("Category") {
                    Picker("Category", selection: $selectedCategory) {
                        Text("All Categories").tag(nil as String?)
                        ForEach(categories, id: \.self) { category in
                            Text(category).tag(category as String?)
                        }
                    }
                }
                
                Section("Type") {
                    Picker("Type", selection: $selectedType) {
                        Text("All Types").tag(nil as Transaction.TransactionType?)
                        Text("Income").tag(Transaction.TransactionType.income as Transaction.TransactionType?)
                        Text("Expense").tag(Transaction.TransactionType.expense as Transaction.TransactionType?)
                    }
                }
                
                Section {
                    Button("Clear Filters") {
                        selectedCategory = nil
                        selectedType = nil
                    }
                    .foregroundColor(.red)
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

