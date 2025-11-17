//
//  FinancialCalendarView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct FinancialCalendarView: View {
    @EnvironmentObject var dataService: DataService
    @State private var transactions: [Transaction] = []
    @State private var selectedDate = Date()
    
    var transactionsForDate: [Transaction] {
        let calendar = Calendar.current
        return transactions.filter { calendar.isDate($0.date, inSameDayAs: selectedDate) }
    }
    
    var body: some View {
        NavigationView {
            VStack {
                DatePicker("Select Date", selection: $selectedDate, displayedComponents: .date)
                    .padding()
                
                List {
                    ForEach(transactionsForDate) { transaction in
                        TransactionRowView(transaction: transaction)
                    }
                }
            }
            .navigationTitle("Financial Calendar")
            .task {
                await loadTransactions()
            }
        }
    }
    
    private func loadTransactions() async {
        do {
            transactions = try await dataService.fetchTransactions()
        } catch {
            print("Error loading transactions: \(error)")
        }
    }
}

