//
//  SavingsGoalsView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct SavingsGoalsView: View {
    @EnvironmentObject var dataService: DataService
    @State private var goals: [SavingsGoal] = []
    @State private var isLoading = true
    @State private var showingAddGoal = false
    
    var body: some View {
        NavigationView {
            List {
                ForEach(goals) { goal in
                    SavingsGoalRowView(goal: goal)
                }
                .onDelete(perform: deleteGoal)
            }
            .navigationTitle("Savings Goals")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddGoal = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddGoal) {
                AddSavingsGoalView(dataService: dataService)
            }
            .task {
                await loadGoals()
            }
        }
    }
    
    private func loadGoals() async {
        do {
            goals = try await dataService.fetchSavingsGoals()
            isLoading = false
        } catch {
            print("Error loading goals: \(error)")
            isLoading = false
        }
    }
    
    private func deleteGoal(at offsets: IndexSet) {
        for index in offsets {
            let goal = goals[index]
            Task {
                try? await dataService.deleteSavingsGoal(goal)
                await loadGoals()
            }
        }
    }
}

struct SavingsGoalRowView: View {
    let goal: SavingsGoal
    
    var progress: Double {
        min(goal.currentAmount / goal.targetAmount, 1.0)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(goal.name)
                    .font(.headline)
                Spacer()
                Text("$\(String(format: "%.2f", goal.currentAmount)) / $\(String(format: "%.2f", goal.targetAmount))")
                    .font(.subheadline)
            }
            ProgressView(value: progress)
            Text("Target: \(goal.targetDate.formatted(date: .abbreviated, time: .omitted))")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}

struct AddSavingsGoalView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    @State private var name = ""
    @State private var targetAmount = ""
    @State private var targetDate = Date()
    
    var body: some View {
        NavigationView {
            Form {
                TextField("Goal Name", text: $name)
                TextField("Target Amount", text: $targetAmount)
                    .keyboardType(.decimalPad)
                DatePicker("Target Date", selection: $targetDate, displayedComponents: .date)
            }
            .navigationTitle("Add Savings Goal")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveGoal()
                    }
                }
            }
        }
    }
    
    private func saveGoal() {
        guard let amount = Double(targetAmount) else { return }
        
        let goal = SavingsGoal(
            id: UUID().uuidString,
            name: name,
            targetAmount: amount,
            currentAmount: 0,
            targetDate: targetDate,
            priority: 1,
            createdAt: Date()
        )
        
        Task {
            try? await dataService.saveSavingsGoal(goal)
            dismiss()
        }
    }
}

