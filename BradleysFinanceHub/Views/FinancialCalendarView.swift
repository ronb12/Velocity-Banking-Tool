//
//  FinancialCalendarView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-16.
//

import SwiftUI

struct FinancialCalendarView: View {
    @EnvironmentObject var dataService: DataService
    @State private var selectedDate = Date()
    @State private var debts: [Debt] = []
    @State private var recurringTransactions: [RecurringTransaction] = []
    @State private var budgets: [Budget] = []
    @State private var savingsGoals: [SavingsGoal] = []
    
    var calendarEvents: [CalendarEvent] {
        var events: [CalendarEvent] = []
        
        // Debt due dates
        for debt in debts {
            if let dueDate = debt.dueDate {
                events.append(CalendarEvent(
                    id: "debt-\(debt.id)",
                    title: "\(debt.name) Payment Due",
                    date: dueDate,
                    type: .debt,
                    amount: debt.minimumPayment
                ))
            }
        }
        
        // Recurring transactions
        for recurring in recurringTransactions.filter({ $0.isActive }) {
            if recurring.nextDueDate <= Calendar.current.date(byAdding: .month, value: 1, to: Date()) ?? Date() {
                events.append(CalendarEvent(
                    id: "recurring-\(recurring.id)",
                    title: recurring.name,
                    date: recurring.nextDueDate,
                    type: .recurring,
                    amount: recurring.amount
                ))
            }
        }
        
        // Budget reset dates
        for budget in budgets {
            if let nextMonth = Calendar.current.date(byAdding: .month, value: 1, to: budget.month) {
                events.append(CalendarEvent(
                    id: "budget-\(budget.id)",
                    title: "\(budget.category) Budget Resets",
                    date: nextMonth,
                    type: .budget,
                    amount: nil
                ))
            }
        }
        
        // Savings goal target dates
        for goal in savingsGoals {
            if let targetDate = goal.targetDate {
                events.append(CalendarEvent(
                    id: "goal-\(goal.id)",
                    title: "\(goal.name) Target Date",
                    date: targetDate,
                    type: .goal,
                    amount: goal.targetAmount
                ))
            }
        }
        
        return events.sorted { $0.date < $1.date }
    }
    
    var body: some View {
        NavigationView {
            List {
                ForEach(groupedEvents) { group in
                    Section(header: Text(group.date, style: .date)) {
                        ForEach(group.events) { event in
                            CalendarEventRow(event: event)
                        }
                    }
                }
            }
            .navigationTitle("Financial Calendar")
            .task {
                await loadData()
            }
        }
    }
    
    private var groupedEvents: [EventGroup] {
        let grouped = Dictionary(grouping: calendarEvents) { event in
            Calendar.current.startOfDay(for: event.date)
        }
        
        return grouped.map { date, events in
            EventGroup(date: date, events: events)
        }.sorted { $0.date < $1.date }
    }
    
    private func loadData() async {
        do {
            async let debtsTask = dataService.fetchDebts()
            async let recurringTask = dataService.fetchRecurringTransactions()
            async let budgetsTask = dataService.fetchBudgets()
            async let goalsTask = dataService.fetchSavingsGoals()
            
            debts = try await debtsTask
            recurringTransactions = try await recurringTask
            budgets = try await budgetsTask
            savingsGoals = try await goalsTask
        } catch {
            print("Error loading calendar data: \(error.localizedDescription)")
            // Keep existing data on error to prevent crashes
        }
    }
}

struct CalendarEvent: Identifiable {
    let id: String
    let title: String
    let date: Date
    let type: EventType
    let amount: Double?
    
    enum EventType {
        case debt
        case recurring
        case budget
        case goal
        
        var icon: String {
            switch self {
            case .debt: return "creditcard.fill"
            case .recurring: return "repeat"
            case .budget: return "calendar"
            case .goal: return "target"
            }
        }
        
        var color: Color {
            switch self {
            case .debt: return .red
            case .recurring: return .blue
            case .budget: return .orange
            case .goal: return .green
            }
        }
    }
}

struct EventGroup: Identifiable {
    let id = UUID()
    let date: Date
    let events: [CalendarEvent]
}

struct CalendarEventRow: View {
    let event: CalendarEvent
    
    var body: some View {
        HStack {
            Image(systemName: event.type.icon)
                .foregroundColor(event.type.color)
                .frame(width: 30)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(event.title)
                    .font(.headline)
                
                Text(event.date, style: .time)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if let amount = event.amount {
                Text(formatCurrency(amount))
                    .font(.headline)
            }
        }
    }
    
    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

