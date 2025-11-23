//
//  MainTabView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authService: AuthenticationService
	@Environment(\.managedObjectContext) private var context
	@StateObject private var dataServiceHolder = DataServiceHolder()
	
	private class DataServiceHolder: ObservableObject {
		@Published var service: DataService?
	}
    
    var body: some View {
			Group {
				if let dataService = dataServiceHolder.service {
					TabView {
						DashboardView()
							.tabItem { Label("Dashboard", systemImage: "house.fill") }
							.environmentObject(dataService)
						
						DebtTrackerView()
							.tabItem { Label("Debts", systemImage: "creditcard.fill") }
							.environmentObject(dataService)
						
						BudgetView()
							.tabItem { Label("Budget", systemImage: "dollarsign.circle.fill") }
							.environmentObject(dataService)
						
                BudgetView() // Using BudgetView instead of ZeroBasedBudgetView
							.tabItem { Label("Zero-Based", systemImage: "equal.circle.fill") }
							.environmentObject(dataService)
						
						TransactionsView()
							.tabItem { Label("Transactions", systemImage: "list.bullet.rectangle") }
							.environmentObject(dataService)
						
						SavingsGoalsView()
							.tabItem { Label("Savings", systemImage: "target") }
							.environmentObject(dataService)
						
						SettingsView()
							.tabItem { Label("Settings", systemImage: "gearshape.fill") }
							.environmentObject(dataService)
						
						NetWorthView()
							.tabItem { Label("Net Worth", systemImage: "chart.line.uptrend.xyaxis") }
							.environmentObject(dataService)
						
						ChartsView()
							.tabItem { Label("Charts", systemImage: "chart.bar.fill") }
							.environmentObject(dataService)
						
						CreditScoreEstimatorView()
							.tabItem { Label("Credit", systemImage: "gauge") }
						
						VelocityCalculatorView()
							.tabItem { Label("Velocity", systemImage: "function") }
							.environmentObject(dataService)
						
						ActivityFeedView()
							.tabItem { Label("Activity", systemImage: "clock.fill") }
							.environmentObject(dataService)
						
						ChallengeLibraryView()
							.tabItem { Label("Challenges", systemImage: "book.fill") }
						
						NotificationsView()
							.tabItem { Label("Alerts", systemImage: "bell.badge.fill") }
						
						RecurringTransactionsView()
							.tabItem { Label("Recurring", systemImage: "repeat") }
							.environmentObject(dataService)
						
						ReportsView()
							.tabItem { Label("Reports", systemImage: "doc.text.fill") }
							.environmentObject(dataService)
						
						InsightsView()
							.tabItem { Label("Insights", systemImage: "lightbulb.fill") }
							.environmentObject(dataService)
						
						FinancialCalendarView()
							.tabItem { Label("Calendar", systemImage: "calendar") }
							.environmentObject(dataService)
						
						AccountsView()
							.tabItem { Label("Accounts", systemImage: "building.columns.fill") }
							.environmentObject(dataService)
						
						FinancialHealthScoreView()
							.tabItem { Label("Health", systemImage: "heart.fill") }
							.environmentObject(dataService)
						
						DebtPayoffTimelineView()
							.tabItem { Label("Payoff", systemImage: "chart.line.downtrend.xyaxis") }
							.environmentObject(dataService)
						
						EmergencyFundTrackerView()
							.tabItem { Label("Emergency", systemImage: "shield.fill") }
							.environmentObject(dataService)
					}
				} else {
					VStack(spacing: 12) {
						ProgressView()
						Text("Loading…")
							.foregroundColor(.secondary)
							.font(.footnote)
					}
				}
			}
		.task {
			if dataServiceHolder.service == nil {
				// Wait for Core Data persistent store to be ready
				// Check if the coordinator and stores are available
				var attempts = 0
				while attempts < 50 { // Wait up to 5 seconds (50 * 0.1)
					if let coordinator = context.persistentStoreCoordinator,
					   !coordinator.persistentStores.isEmpty {
						break
					}
					try? await Task.sleep(nanoseconds: 100_000_000) // 0.1 seconds
					attempts += 1
				}
				
			// Verify Core Data is ready before creating DataService
			if let coordinator = context.persistentStoreCoordinator,
			   !coordinator.persistentStores.isEmpty {
				print("✅ Core Data is ready")
			} else {
				print("⚠️ Warning: Core Data not ready after waiting, creating DataService anyway")
			}
			
			let service = DataService(context: context)
				// Run migration after store is confirmed loaded
				service.performMigrationIfNeeded()
				dataServiceHolder.service = service
			}
		}
    }
}

