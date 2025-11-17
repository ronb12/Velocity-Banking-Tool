//
//  ActivityFeedView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct ActivityFeedView: View {
    @EnvironmentObject var dataService: DataService
    @State private var activities: [Activity] = []
    @State private var isLoading = true
    
    var body: some View {
        NavigationView {
            List {
                ForEach(activities) { activity in
                    ActivityRowView(activity: activity)
                }
            }
            .navigationTitle("Activity Feed")
            .task {
                await loadActivities()
            }
        }
    }
    
    private func loadActivities() async {
        do {
            activities = try await dataService.fetchActivities()
            isLoading = false
        } catch {
            print("Error loading activities: \(error)")
            isLoading = false
        }
    }
}

struct ActivityRowView: View {
    let activity: Activity
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(activity.description)
                    .font(.headline)
                Text(activity.date.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            if let amount = activity.amount {
                Text("$\(String(format: "%.2f", amount))")
                    .font(.subheadline)
                    .fontWeight(.semibold)
            }
        }
    }
}

