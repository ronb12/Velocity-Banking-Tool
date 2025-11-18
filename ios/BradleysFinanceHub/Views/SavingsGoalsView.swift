//
//  SavingsGoalsView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct SavingsGoalsView: View {
    @EnvironmentObject var dataService: DataService
    @State private var showingAddGoal = false
    
    var body: some View {
        NavigationView {
            SavingsGoalsViewContent(showingAddGoal: $showingAddGoal)
                .environmentObject(dataService)
        }
    }
}

struct SavingsGoalsViewContent: View {
    @EnvironmentObject var dataService: DataService
    @Binding var showingAddGoal: Bool
    @State private var goals: [SavingsGoal] = []
    @State private var isLoading = true
    @State private var editingGoal: SavingsGoal?
    @State private var loadTask: Task<Void, Never>?
    
    var body: some View {
        ScrollView {
            Group {
                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, minHeight: 200)
                } else if goals.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "target")
                            .font(.system(size: 50))
                            .foregroundColor(.secondary)
                        Text("No Savings Goals Yet")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        Text("Tap the + button to create your first savings goal")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, minHeight: 200)
                    .padding()
                } else {
                    VStack(spacing: 12) {
                        ForEach(goals) { goal in
                            SavingsGoalRowView(goal: goal)
                                .onTapGesture {
                                    editingGoal = goal
                                }
                        }
                    }
                    .padding()
                }
            }
        }
            .sheet(isPresented: $showingAddGoal) {
                AddSavingsGoalView(dataService: dataService)
                    .onDisappear {
                        refreshGoals()
                    }
            }
            .sheet(item: $editingGoal) { goal in
                EditSavingsGoalView(dataService: dataService, goal: goal)
                    .onDisappear {
                        refreshGoals()
                    }
            }
            .task {
                await loadGoals()
            }
            .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("DemoDataLoaded"))) { _ in
                Task {
                    try? await Task.sleep(nanoseconds: 500_000_000)
                    await loadGoals()
                }
            }
            .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("SavingsGoalCreated"))) { _ in
                refreshGoals()
            }
            .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("GoalsTabChanged"))) { _ in
                refreshGoals()
            }
            .onDisappear {
                loadTask?.cancel()
            }
    }
    
    private func refreshGoals() {
        loadTask?.cancel()
        loadTask = Task { @MainActor in
            await performLoadGoals()
        }
    }
    
    private func loadGoals() async {
        loadTask?.cancel()
        loadTask = Task { @MainActor in
            await performLoadGoals()
        }
        await loadTask?.value
    }
    
    private func performLoadGoals() async {
        do {
            print("📊 SavingsGoalsView: Loading goals...")
            let fetchedGoals = try await dataService.fetchSavingsGoals()
            print("📊 SavingsGoalsView: Fetched \(fetchedGoals.count) goals")
            
            // Check if task was cancelled
            try Task.checkCancellation()
            
            goals = fetchedGoals
            isLoading = false
        } catch {
            if error is CancellationError {
                return
            }
            print("❌ Error loading goals: \(error)")
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
            if let targetDate = goal.targetDate {
                Text("Target: \(targetDate.formatted(date: .abbreviated, time: .omitted))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
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
    @State private var isSaving = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            Form {
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
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
                    .disabled(isSaving || name.isEmpty || targetAmount.isEmpty)
                }
            }
        }
    }
    
    private func saveGoal() {
        guard let amount = Double(targetAmount), amount > 0 else {
            errorMessage = "Please enter a valid amount"
            return
        }
        
        guard !name.isEmpty else {
            errorMessage = "Please enter a goal name"
            return
        }
        
        isSaving = true
        errorMessage = nil
        
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
            do {
                try await dataService.saveSavingsGoal(goal)
                await MainActor.run {
                    isSaving = false
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isSaving = false
                    errorMessage = "Failed to save: \(error.localizedDescription)"
                }
            }
        }
    }
}

struct EditSavingsGoalView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    let goal: SavingsGoal
    @State private var name: String
    @State private var targetAmount: String
    @State private var targetDate: Date?
    @State private var isSaving = false
    @State private var errorMessage: String?
    
    init(dataService: DataService, goal: SavingsGoal) {
        self.dataService = dataService
        self.goal = goal
        _name = State(initialValue: goal.name)
        _targetAmount = State(initialValue: String(format: "%.2f", goal.targetAmount))
        _targetDate = State(initialValue: goal.targetDate ?? Date())
    }
    
    var body: some View {
        NavigationView {
            Form {
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                TextField("Goal Name", text: $name)
                TextField("Target Amount", text: $targetAmount)
                    .keyboardType(.decimalPad)
                DatePicker("Target Date", selection: Binding(
                    get: { targetDate ?? Date() },
                    set: { targetDate = $0 }
                ), displayedComponents: .date)
            }
            .navigationTitle("Edit Savings Goal")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveGoal()
                    }
                    .disabled(isSaving || name.isEmpty || targetAmount.isEmpty)
                }
            }
        }
    }
    
    private func saveGoal() {
        guard let amount = Double(targetAmount), amount > 0 else {
            errorMessage = "Please enter a valid amount"
            return
        }
        
        guard !name.isEmpty else {
            errorMessage = "Please enter a goal name"
            return
        }
        
        isSaving = true
        errorMessage = nil
        
        var updatedGoal = goal
        updatedGoal.name = name
        updatedGoal.targetAmount = amount
        updatedGoal.targetDate = targetDate
        
        Task {
            do {
                try await dataService.saveSavingsGoal(updatedGoal)
                await MainActor.run {
                    isSaving = false
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isSaving = false
                    errorMessage = "Failed to save: \(error.localizedDescription)"
                }
            }
        }
    }
}

