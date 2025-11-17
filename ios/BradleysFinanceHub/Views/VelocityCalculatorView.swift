//
//  VelocityCalculatorView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct VelocityCalculatorView: View {
    @EnvironmentObject var dataService: DataService
    @State private var monthlyIncome: String = ""
    @State private var monthlyExpenses: String = ""
    @State private var debtBalance: String = ""
    @State private var extraPayment: String = ""
    
    var availableCash: Double {
        guard let income = Double(monthlyIncome),
              let expenses = Double(monthlyExpenses) else { return 0 }
        return income - expenses
    }
    
    var payoffTime: Int {
        guard let balance = Double(debtBalance),
              let extra = Double(extraPayment),
              availableCash > 0 else { return 0 }
        let totalPayment = availableCash + extra
        return Int(ceil(balance / totalPayment))
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section("Income & Expenses") {
                    TextField("Monthly Income", text: $monthlyIncome)
                        .keyboardType(.decimalPad)
                    TextField("Monthly Expenses", text: $monthlyExpenses)
                        .keyboardType(.decimalPad)
                }
                
                Section("Debt Information") {
                    TextField("Debt Balance", text: $debtBalance)
                        .keyboardType(.decimalPad)
                    TextField("Extra Payment", text: $extraPayment)
                        .keyboardType(.decimalPad)
                }
                
                Section("Results") {
                    HStack {
                        Text("Available Cash Flow")
                        Spacer()
                        Text("$\(String(format: "%.2f", availableCash))")
                            .fontWeight(.semibold)
                    }
                    
                    HStack {
                        Text("Payoff Time")
                        Spacer()
                        Text("\(payoffTime) months")
                            .fontWeight(.semibold)
                    }
                }
            }
            .navigationTitle("Velocity Calculator")
        }
    }
}

