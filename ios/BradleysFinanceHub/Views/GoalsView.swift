//
//  GoalsView.swift
//  BradleysFinanceHub
//
//  Consolidated view for Savings Goals, Debts, and Emergency Fund
//

import SwiftUI

struct GoalsView: View {
    @EnvironmentObject var dataService: DataService
    @State private var selectedTab = 0
    @State private var showingAddSavingsGoal = false
    @State private var showingAddDebt = false
    @State private var showingAddInvestment = false
    @State private var showingAddEmergencyFund = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Segmented Control
                Picker("View", selection: $selectedTab) {
                    Text("Savings").tag(0)
                    Text("Debts").tag(1)
                    Text("Investments").tag(2)
                    Text("Emergency").tag(3)
                }
                .pickerStyle(.segmented)
                .padding()
                
                // Content based on selection
                Group {
                    switch selectedTab {
                    case 0:
                        SavingsGoalsViewContent(showingAddGoal: $showingAddSavingsGoal)
                            .environmentObject(dataService)
                    case 1:
                        DebtTrackerViewContent(showingAddDebt: $showingAddDebt)
                            .environmentObject(dataService)
                    case 2:
                        InvestmentTrackerView(showingAddInvestment: $showingAddInvestment)
                            .environmentObject(dataService)
                    case 3:
                        EmergencyFundTrackerView(showingAddFund: $showingAddEmergencyFund)
                            .environmentObject(dataService)
                    default:
                        SavingsGoalsViewContent(showingAddGoal: $showingAddSavingsGoal)
                            .environmentObject(dataService)
                    }
                }
            }
            .navigationTitle("Goals")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        switch selectedTab {
                        case 0:
                            showingAddSavingsGoal = true
                        case 1:
                            showingAddDebt = true
                        case 2:
                            showingAddInvestment = true
                        case 3:
                            showingAddEmergencyFund = true
                        default:
                            break
                        }
                    }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .onChange(of: selectedTab) { _, _ in
                // Refresh data when tab changes
                NotificationCenter.default.post(name: NSNotification.Name("GoalsTabChanged"), object: nil)
            }
            .sheet(isPresented: $showingAddSavingsGoal) {
                AddSavingsGoalView(dataService: dataService)
            }
            .sheet(isPresented: $showingAddDebt) {
                AddDebtView(dataService: dataService)
            }
            .sheet(isPresented: $showingAddInvestment) {
                AddInvestmentView(dataService: dataService)
            }
            .sheet(isPresented: $showingAddEmergencyFund) {
                AddEmergencyFundView(dataService: dataService)
            }
        }
    }
}

