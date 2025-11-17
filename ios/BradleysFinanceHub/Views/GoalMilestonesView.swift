//
//  GoalMilestonesView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct GoalMilestonesView: View {
    @EnvironmentObject var dataService: DataService
    @State private var goals: [SavingsGoal] = []
    
    var body: some View {
        NavigationView {
            List {
                ForEach(goals) { goal in
                    MilestoneRowView(goal: goal)
                }
            }
            .navigationTitle("Goal Milestones")
            .task {
                await loadGoals()
            }
        }
    }
    
    private func loadGoals() async {
        do {
            goals = try await dataService.fetchSavingsGoals()
        } catch {
            print("Error loading goals: \(error)")
        }
    }
}

struct MilestoneRowView: View {
    let goal: SavingsGoal
    
    var milestones: [Double] {
        [0.25, 0.50, 0.75, 1.0]
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(goal.name)
                .font(.headline)
            
            ForEach(milestones, id: \.self) { milestone in
                let target = goal.targetAmount * milestone
                let achieved = goal.currentAmount >= target
                
                HStack {
                    Image(systemName: achieved ? "checkmark.circle.fill" : "circle")
                        .foregroundColor(achieved ? .green : .gray)
                    Text("\(Int(milestone * 100))% - $\(String(format: "%.2f", target))")
                        .font(.subheadline)
                        .strikethrough(achieved)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

