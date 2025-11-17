//
//  ReportsView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct ReportsView: View {
    @EnvironmentObject var dataService: DataService
    @State private var transactions: [Transaction] = []
    @State private var budgets: [Budget] = []
    @State private var selectedMonth = Date()
    @State private var reportText = ""
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    DatePicker("Select Month", selection: $selectedMonth, displayedComponents: .date)
                        .padding()
                    
                    Text(reportText)
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                        .padding()
                }
            }
            .navigationTitle("Reports")
            .task {
                await loadData()
            }
            .onChange(of: selectedMonth) { _ in
                generateReport()
            }
        }
    }
    
    private func loadData() async {
        do {
            async let t = dataService.fetchTransactions()
            async let b = dataService.fetchBudgets()
            transactions = try await t
            budgets = try await b
            generateReport()
        } catch {
            print("Error loading data: \(error)")
        }
    }
    
    private func generateReport() {
        let reportService = FinancialReportService()
        reportText = reportService.generateMonthlyReport(
            transactions: transactions,
            budgets: budgets,
            month: selectedMonth
        )
    }
}

