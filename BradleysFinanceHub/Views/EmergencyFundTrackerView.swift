//
//  EmergencyFundTrackerView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-16.
//

import SwiftUI

struct EmergencyFundTrackerView: View {
    @EnvironmentObject var dataService: DataService
    @State private var transactions: [Transaction] = []
    @State private var savingsGoals: [SavingsGoal] = []
    @State private var monthsOfExpenses: Int = 6
    
    var monthlyExpenses: Double {
        let calendar = Calendar.current
        let currentMonth = calendar.startOfDay(for: Date())
        let monthTransactions = transactions.filter { transaction in
            calendar.isDate(transaction.date, equalTo: currentMonth, toGranularity: .month) && transaction.type == .expense
        }
        return monthTransactions.reduce(0) { $0 + $1.amount }
    }
    
    var recommendedAmount: Double {
        monthlyExpenses * Double(monthsOfExpenses)
    }
    
    var currentEmergencyFund: Double {
        // Sum all savings goals marked as emergency fund
        savingsGoals.filter { $0.name.lowercased().contains("emergency") || $0.name.lowercased().contains("fund") }
            .reduce(0) { $0 + $1.currentAmount }
    }
    
    var progress: Double {
        guard recommendedAmount > 0 else { return 0 }
        return min(currentEmergencyFund / recommendedAmount, 1.0)
    }
    
    var isFullyFunded: Bool {
        currentEmergencyFund >= recommendedAmount
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    progressCard
                    recommendationCard
                    statusCard
                }
                .padding()
            }
            .navigationTitle("Emergency Fund")
            .task {
                await loadData()
            }
        }
    }
    
    private var progressCard: some View {
        VStack(spacing: 16) {
            Text("Emergency Fund Progress")
                .font(.headline)
            
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 20)
                    .frame(width: 200, height: 200)
                
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(isFullyFunded ? Color.green : Color.blue, style: StrokeStyle(lineWidth: 20, lineCap: .round))
                    .frame(width: 200, height: 200)
                    .rotationEffect(.degrees(-90))
                
                VStack {
                    Text("\(Int(progress * 100))%")
                        .font(.system(size: 50, weight: .bold))
                    
                    Text(isFullyFunded ? "Funded!" : "In Progress")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            VStack(spacing: 8) {
                HStack {
                    Text("Current Amount")
                    Spacer()
                    Text(formatCurrency(currentEmergencyFund))
                        .fontWeight(.semibold)
                }
                
                HStack {
                    Text("Target Amount")
                    Spacer()
                    Text(formatCurrency(recommendedAmount))
                        .fontWeight(.semibold)
                }
                
                HStack {
                    Text("Remaining")
                    Spacer()
                    Text(formatCurrency(max(0, recommendedAmount - currentEmergencyFund)))
                        .fontWeight(.semibold)
                        .foregroundColor(.red)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(16)
    }
    
    private var recommendationCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recommendation")
                .font(.headline)
            
            HStack {
                Text("Months of Expenses")
                Spacer()
                Stepper("\(monthsOfExpenses) months", value: $monthsOfExpenses, in: 3...12)
            }
            
            Text("Financial experts recommend having \(monthsOfExpenses) months of expenses saved for emergencies.")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    private var statusCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Status")
                .font(.headline)
            
            if isFullyFunded {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("Your emergency fund is fully funded!")
                        .font(.subheadline)
                }
            } else {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.orange)
                    Text("You need \(formatCurrency(recommendedAmount - currentEmergencyFund)) more to fully fund your emergency fund.")
                        .font(.subheadline)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    private func loadData() async {
        do {
            async let transactionsTask = dataService.fetchTransactions()
            async let goalsTask = dataService.fetchSavingsGoals()
            
            transactions = try await transactionsTask
            savingsGoals = try await goalsTask
        } catch {
            print("Error loading emergency fund data: \(error.localizedDescription)")
            // Keep existing data on error to prevent crashes
        }
    }
    
    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

