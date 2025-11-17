//
//  EmergencyFundTrackerView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct EmergencyFundTrackerView: View {
    @EnvironmentObject var dataService: DataService
    @State private var targetAmount: Double = 0
    @State private var currentAmount: Double = 0
    @State private var showingEdit = false
    
    var progress: Double {
        guard targetAmount > 0 else { return 0 }
        return min(currentAmount / targetAmount, 1.0)
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                VStack(spacing: 16) {
                    Text("Emergency Fund")
                        .font(.title)
                        .fontWeight(.bold)
                    
                    Text("$\(String(format: "%.2f", currentAmount))")
                        .font(.system(size: 48, weight: .bold))
                        .foregroundColor(.blue)
                    
                    Text("of $\(String(format: "%.2f", targetAmount))")
                        .font(.title3)
                        .foregroundColor(.secondary)
                    
                    ProgressView(value: progress)
                        .scaleEffect(x: 1, y: 2, anchor: .center)
                        .padding(.horizontal)
                }
                .padding()
                
                Spacer()
            }
            .navigationTitle("Emergency Fund")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingEdit = true }) {
                        Image(systemName: "pencil")
                    }
                }
            }
            .sheet(isPresented: $showingEdit) {
                EditEmergencyFundView(targetAmount: $targetAmount, currentAmount: $currentAmount)
            }
        }
    }
}

struct EditEmergencyFundView: View {
    @Environment(\.dismiss) var dismiss
    @Binding var targetAmount: Double
    @Binding var currentAmount: Double
    @State private var targetText = ""
    @State private var currentText = ""
    
    var body: some View {
        NavigationView {
            Form {
                TextField("Target Amount", text: $targetText)
                    .keyboardType(.decimalPad)
                TextField("Current Amount", text: $currentText)
                    .keyboardType(.decimalPad)
            }
            .navigationTitle("Edit Emergency Fund")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        if let target = Double(targetText) {
                            targetAmount = target
                        }
                        if let current = Double(currentText) {
                            currentAmount = current
                        }
                        dismiss()
                    }
                }
            }
            .onAppear {
                targetText = String(format: "%.2f", targetAmount)
                currentText = String(format: "%.2f", currentAmount)
            }
        }
    }
}

