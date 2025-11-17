//
//  NotificationsView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct NotificationsView: View {
    @State private var notificationsEnabled = false
    @State private var budgetAlerts = true
    @State private var debtReminders = true
    
    var body: some View {
        NavigationView {
            Form {
                Section("Notification Settings") {
                    Toggle("Enable Notifications", isOn: $notificationsEnabled)
                    Toggle("Budget Alerts", isOn: $budgetAlerts)
                        .disabled(!notificationsEnabled)
                    Toggle("Debt Reminders", isOn: $debtReminders)
                        .disabled(!notificationsEnabled)
                }
                
                Section {
                    Button("Request Permission") {
                        Task {
                            await NotificationsManager.shared.requestAuthorization()
                        }
                    }
                }
            }
            .navigationTitle("Notifications")
        }
    }
}

