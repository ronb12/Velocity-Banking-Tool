//
//  ChallengeLibraryView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct ChallengeLibraryView: View {
    @EnvironmentObject var dataService: DataService
    @State private var selectedChallenge: Challenge?
    
    let challenges = [
        Challenge(
            name: "52 Week Challenge",
            description: "Save $1 the first week, $2 the second, and so on. By the end of 52 weeks, you'll have saved $1,378!",
            target: 1378,
            duration: "52 weeks",
            weeklyAmounts: (1...52).map { Double($0) }
        ),
        Challenge(
            name: "No Spend Challenge",
            description: "30 days of no unnecessary spending. Only spend on essentials like groceries, bills, and gas.",
            target: 0,
            duration: "30 days",
            weeklyAmounts: []
        ),
        Challenge(
            name: "Emergency Fund",
            description: "Build a 6-month emergency fund to cover unexpected expenses and financial emergencies.",
            target: 0,
            duration: "6 months",
            weeklyAmounts: []
        ),
        Challenge(
            name: "Holiday Savings",
            description: "Save for holiday expenses throughout the year so you're prepared when the season arrives.",
            target: 0,
            duration: "12 months",
            weeklyAmounts: []
        )
    ]
    
    var body: some View {
        NavigationView {
            List {
                ForEach(challenges) { challenge in
                    Button(action: {
                        selectedChallenge = challenge
                    }) {
                        ChallengeRowView(challenge: challenge)
                    }
                    .buttonStyle(.plain)
                }
            }
            .navigationTitle("Savings Challenges")
            .sheet(item: $selectedChallenge) { challenge in
                ChallengeDetailView(challenge: challenge)
                    .environmentObject(dataService)
            }
        }
    }
}

struct Challenge: Identifiable {
    let id = UUID()
    let name: String
    let description: String
    let target: Double
    let duration: String
    let weeklyAmounts: [Double]
}

struct ChallengeRowView: View {
    let challenge: Challenge
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 8) {
                Text(challenge.name)
                    .font(.headline)
                    .foregroundColor(.primary)
                Text(challenge.description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
                HStack {
                    if challenge.target > 0 {
                        Text("Target: $\(String(format: "%.2f", challenge.target))")
                            .font(.caption)
                            .foregroundColor(.blue)
                    }
                    Text("• \(challenge.duration)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundColor(.secondary)
                .font(.caption)
        }
        .padding(.vertical, 4)
    }
}

struct ChallengeDetailView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var dataService: DataService
    let challenge: Challenge
    @State private var showingStartChallenge = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Challenge Header
                    VStack(alignment: .leading, spacing: 12) {
                        Text(challenge.name)
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        Text(challenge.description)
                            .font(.body)
                            .foregroundColor(.secondary)
                        
                        HStack {
                            Label(challenge.duration, systemImage: "calendar")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            
                            if challenge.target > 0 {
                                Spacer()
                                Label("$\(String(format: "%.2f", challenge.target))", systemImage: "target")
                                    .font(.subheadline)
                                    .foregroundColor(.blue)
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(16)
                    
                    // 52 Week Challenge Details
                    if challenge.name == "52 Week Challenge" && !challenge.weeklyAmounts.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Weekly Breakdown")
                                .font(.headline)
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 12) {
                                    ForEach(Array(challenge.weeklyAmounts.enumerated()), id: \.offset) { index, amount in
                                        VStack(spacing: 4) {
                                            Text("Week \(index + 1)")
                                                .font(.caption2)
                                                .foregroundColor(.secondary)
                                            Text("$\(String(format: "%.0f", amount))")
                                                .font(.caption)
                                                .fontWeight(.semibold)
                                        }
                                        .padding(8)
                                        .background(Color.blue.opacity(0.1))
                                        .cornerRadius(8)
                                    }
                                }
                            }
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(16)
                    }
                    
                    // How It Works
                    VStack(alignment: .leading, spacing: 12) {
                        Text("How It Works")
                            .font(.headline)
                        
                        VStack(alignment: .leading, spacing: 8) {
                            if challenge.name == "52 Week Challenge" {
                                Text("• Start by saving $1 in week 1")
                                Text("• Increase your savings by $1 each week")
                                Text("• By week 52, you'll save $52")
                                Text("• Total saved: $1,378")
                            } else if challenge.name == "No Spend Challenge" {
                                Text("• Only spend on essentials (groceries, bills, gas)")
                                Text("• Avoid dining out, shopping, entertainment")
                                Text("• Track your savings for 30 days")
                                Text("• See how much you can save!")
                            } else if challenge.name == "Emergency Fund" {
                                Text("• Calculate 6 months of expenses")
                                Text("• Set a monthly savings goal")
                                Text("• Track your progress")
                                Text("• Build your safety net")
                            } else {
                                Text("• Set your holiday budget")
                                Text("• Divide by 12 months")
                                Text("• Save monthly")
                                Text("• Be ready for the holidays!")
                            }
                        }
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(16)
                    
                    // Start Challenge Button
                    Button(action: {
                        showingStartChallenge = true
                    }) {
                        HStack {
                            Image(systemName: "play.circle.fill")
                            Text("Start This Challenge")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                }
                .padding()
            }
            .navigationTitle("Challenge Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .sheet(isPresented: $showingStartChallenge) {
                StartChallengeView(challenge: challenge)
                    .environmentObject(dataService)
            }
        }
    }
}

struct StartChallengeView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var dataService: DataService
    let challenge: Challenge
    @State private var targetAmount: String = ""
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
                
                Section("Challenge Goal") {
                    Text(challenge.name)
                        .font(.headline)
                    Text(challenge.description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Section("Set Your Target") {
                    if challenge.target > 0 {
                        Text("Default Target: $\(String(format: "%.2f", challenge.target))")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    TextField("Target Amount", text: $targetAmount)
                        .keyboardType(.decimalPad)
                        .onAppear {
                            if challenge.target > 0 {
                                targetAmount = String(format: "%.2f", challenge.target)
                            }
                        }
                }
                
                Section {
                    Button(action: {
                        createSavingsGoal()
                    }) {
                        HStack {
                            if isSaving {
                                ProgressView()
                                    .scaleEffect(0.8)
                            }
                            Text(isSaving ? "Creating..." : "Create Savings Goal")
                        }
                    }
                    .disabled(isSaving || targetAmount.isEmpty)
                }
            }
            .navigationTitle("Start Challenge")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
    
    private func createSavingsGoal() {
        guard let amount = Double(targetAmount), amount > 0 else {
            errorMessage = "Please enter a valid amount"
            return
        }
        
        isSaving = true
        errorMessage = nil
        
        // Calculate target date based on challenge duration
        let targetDate: Date
        if challenge.duration.contains("week") {
            let weeks = Int(challenge.duration.components(separatedBy: " ").first ?? "52") ?? 52
            targetDate = Calendar.current.date(byAdding: .weekOfYear, value: weeks, to: Date()) ?? Date()
        } else if challenge.duration.contains("month") {
            let months = Int(challenge.duration.components(separatedBy: " ").first ?? "6") ?? 6
            targetDate = Calendar.current.date(byAdding: .month, value: months, to: Date()) ?? Date()
        } else if challenge.duration.contains("day") {
            let days = Int(challenge.duration.components(separatedBy: " ").first ?? "30") ?? 30
            targetDate = Calendar.current.date(byAdding: .day, value: days, to: Date()) ?? Date()
        } else {
            targetDate = Calendar.current.date(byAdding: .year, value: 1, to: Date()) ?? Date()
        }
        
        let savingsGoal = SavingsGoal(
            id: UUID().uuidString,
            name: challenge.name,
            targetAmount: amount,
            currentAmount: 0,
            targetDate: targetDate,
            priority: 1, // High priority (1 = highest)
            createdAt: Date()
        )
        
        Task {
            do {
                try await dataService.saveSavingsGoal(savingsGoal)
                // Wait a moment for data to be saved
                try? await Task.sleep(nanoseconds: 500_000_000)
                
                await MainActor.run {
                    isSaving = false
                    dismiss()
                }
                
                // Post notification to refresh savings goals view
                NotificationCenter.default.post(name: NSNotification.Name("SavingsGoalCreated"), object: nil)
                
                // Also post DemoDataLoaded to trigger refresh
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    NotificationCenter.default.post(name: NSNotification.Name("DemoDataLoaded"), object: nil)
                }
            } catch {
                await MainActor.run {
                    isSaving = false
                    errorMessage = "Failed to create goal: \(error.localizedDescription)"
                }
            }
        }
    }
}

