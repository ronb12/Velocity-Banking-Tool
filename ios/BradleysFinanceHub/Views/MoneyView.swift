//
//  MoneyView.swift
//  BradleysFinanceHub
//
//  Consolidated view for Transactions, Budgets, and Bills
//

import SwiftUI

struct MoneyView: View {
    @EnvironmentObject var dataService: DataService
    @State private var selectedTab = 0
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Segmented Control
                Picker("View", selection: $selectedTab) {
                    Text("Transactions").tag(0)
                    Text("Budgets").tag(1)
                    Text("Zero-Based").tag(2)
                    Text("Bills").tag(3)
                }
                .pickerStyle(.segmented)
                .padding()
                
                // Content based on selection
                Group {
                    switch selectedTab {
                    case 0:
                        TransactionsViewContent()
                            .environmentObject(dataService)
                    case 1:
                        BudgetViewContent()
                            .environmentObject(dataService)
                    case 2:
                        ZeroBasedBudgetView()
                            .environmentObject(dataService)
                    case 3:
                        BillsViewContent()
                            .environmentObject(dataService)
                    default:
                        TransactionsViewContent()
                            .environmentObject(dataService)
                    }
                }
            }
            .navigationTitle("Money")
        }
    }
}

