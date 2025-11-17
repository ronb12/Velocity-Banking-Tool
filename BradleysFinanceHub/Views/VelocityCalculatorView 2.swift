//
//  VelocityCalculatorView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct VelocityCalculatorView: View {
    @State private var totalDebt = ""
    @State private var monthlyPayment = ""
    @State private var interestRate = ""
    @State private var result: String?
    
    var body: some View {
        Form {
            Section {
                TextField("Total Debt", text: $totalDebt)
                    .keyboardType(.decimalPad)
                TextField("Monthly Payment", text: $monthlyPayment)
                    .keyboardType(.decimalPad)
                TextField("Interest Rate (%)", text: $interestRate)
                    .keyboardType(.decimalPad)
            }
            
            Section {
                Button("Calculate") {
                    calculate()
                }
            }
            
            if let result = result {
                Section {
                    Text(result)
                }
            }
        }
        .navigationTitle("Velocity Calculator")
    }
    
    private func calculate() {
        guard let debt = Double(totalDebt),
              let payment = Double(monthlyPayment),
              let rate = Double(interestRate) else {
            result = "Please enter valid numbers"
            return
        }
        
        let monthlyRate = rate / 100 / 12
        var balance = debt
        var months = 0
        
        while balance > 0 && months < 600 {
            balance = balance * (1 + monthlyRate) - payment
            months += 1
        }
        
        let years = Double(months) / 12
        result = String(format: "Payoff time: %.1f years (%d months)", years, months)
    }
}


