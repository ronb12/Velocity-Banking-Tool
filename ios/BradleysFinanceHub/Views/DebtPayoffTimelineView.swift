//
//  DebtPayoffTimelineView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct DebtPayoffTimelineView: View {
    @EnvironmentObject var dataService: DataService
    @State private var debts: [Debt] = []
    
    var body: some View {
        NavigationView {
            List {
                ForEach(debts) { debt in
                    DebtTimelineRowView(debt: debt)
                }
            }
            .navigationTitle("Payoff Timeline")
            .task {
                await loadDebts()
            }
        }
    }
    
    private func loadDebts() async {
        do {
            debts = try await dataService.fetchDebts()
        } catch {
            print("Error loading debts: \(error)")
        }
    }
}

struct DebtTimelineRowView: View {
    let debt: Debt
    
    var payoffMonths: Int {
        guard debt.minimumPayment > 0 else { return 0 }
        return Int(ceil(debt.balance / debt.minimumPayment))
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(debt.name)
                .font(.headline)
            Text("Balance: $\(String(format: "%.2f", debt.balance))")
                .font(.subheadline)
            Text("Estimated payoff: \(payoffMonths) months")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}

