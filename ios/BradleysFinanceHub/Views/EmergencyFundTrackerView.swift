//
//  EmergencyFundTrackerView.swift
//
//  Multiple Emergency Funds Support
//

import SwiftUI

struct EmergencyFund: Identifiable, Codable {
    let id: String
    var name: String
    var targetAmount: Double
    var currentAmount: Double
    var createdAt: Date
    
    init(id: String = UUID().uuidString, name: String, targetAmount: Double, currentAmount: Double = 0, createdAt: Date = Date()) {
        self.id = id
        self.name = name
        self.targetAmount = targetAmount
        self.currentAmount = currentAmount
        self.createdAt = createdAt
    }
}

struct EmergencyFundTrackerView: View {
    @EnvironmentObject var dataService: DataService
    @Binding var showingAddFund: Bool
    @State private var funds: [EmergencyFund] = []
    @State private var editingFund: EmergencyFund?
    @State private var isLoading = true
    
    var body: some View {
        ScrollView {
            Group {
                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, minHeight: 200)
                } else if funds.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.circle.fill")
                            .font(.system(size: 50))
                            .foregroundColor(.orange)
                        Text("No Emergency Funds")
                            .font(.headline)
                        Text("Tap the + button to create your first emergency fund")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, minHeight: 200)
                    .padding()
                } else {
                    VStack(spacing: 16) {
                        ForEach(funds) { fund in
                            EmergencyFundCard(fund: fund)
                                .onTapGesture {
                                    editingFund = fund
                                }
                        }
                    }
                    .padding()
                }
            }
        }
        .sheet(isPresented: $showingAddFund) {
            AddEmergencyFundView(dataService: dataService)
                .onDisappear {
                    loadFunds()
                }
        }
        .sheet(item: $editingFund) { fund in
            EditEmergencyFundView(fund: fund, dataService: dataService)
                .onDisappear {
                    loadFunds()
                }
        }
        .task {
            loadFunds()
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("DemoDataLoaded"))) { _ in
            Task {
                try? await Task.sleep(nanoseconds: 500_000_000)
                loadFunds()
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("GoalsTabChanged"))) { _ in
            loadFunds()
        }
    }
    
    private func loadFunds() {
        if let data = UserDefaults.standard.data(forKey: "emergencyFunds"),
           let decoded = try? JSONDecoder().decode([EmergencyFund].self, from: data) {
            funds = decoded
        } else {
            funds = []
        }
        isLoading = false
    }
}

struct EmergencyFundCard: View {
    let fund: EmergencyFund
    
    var progress: Double {
        guard fund.targetAmount > 0 else { return 0 }
        return min(fund.currentAmount / fund.targetAmount, 1.0)
    }
    
    var body: some View {
        VStack(spacing: 16) {
            HStack {
                Text(fund.name)
                    .font(.title2)
                    .fontWeight(.bold)
                Spacer()
                Text("$\(String(format: "%.2f", fund.currentAmount))")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(.blue)
            }
            
            Text("of $\(String(format: "%.2f", fund.targetAmount))")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            if fund.targetAmount > 0 {
                let remaining = fund.targetAmount - fund.currentAmount
                Text("$\(String(format: "%.2f", remaining)) remaining")
                    .font(.caption)
                    .foregroundColor(remaining > 0 ? .orange : .green)
            }
            
            // Progress Bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 16)
                        .cornerRadius(8)
                    
                    Rectangle()
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [Color.blue, Color.blue.opacity(0.7)]),
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geometry.size.width * progress, height: 16)
                        .cornerRadius(8)
                }
            }
            .frame(height: 16)
            
            HStack {
                Text("Progress")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text("\(Int(progress * 100))%")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.blue)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(.systemBackground))
                .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 5)
        )
    }
}

struct AddEmergencyFundView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    @State private var name = ""
    @State private var targetAmount = ""
    @State private var currentAmount = ""
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
                TextField("Fund Name", text: $name)
                TextField("Target Amount", text: $targetAmount)
                    .keyboardType(.decimalPad)
                TextField("Current Amount", text: $currentAmount)
                    .keyboardType(.decimalPad)
            }
            .navigationTitle("Add Emergency Fund")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveFund()
                    }
                    .disabled(isSaving || name.isEmpty || targetAmount.isEmpty)
                }
            }
        }
    }
    
    private func saveFund() {
        guard let target = Double(targetAmount), target > 0 else {
            errorMessage = "Please enter a valid target amount"
            return
        }
        
        let current = Double(currentAmount) ?? 0
        
        let fund = EmergencyFund(
            name: name,
            targetAmount: target,
            currentAmount: current
        )
        
        var funds: [EmergencyFund] = []
        if let data = UserDefaults.standard.data(forKey: "emergencyFunds"),
           let decoded = try? JSONDecoder().decode([EmergencyFund].self, from: data) {
            funds = decoded
        }
        funds.append(fund)
        
        if let encoded = try? JSONEncoder().encode(funds) {
            UserDefaults.standard.set(encoded, forKey: "emergencyFunds")
            dismiss()
        } else {
            errorMessage = "Failed to save fund"
        }
    }
}

struct EditEmergencyFundView: View {
    @Environment(\.dismiss) var dismiss
    let fund: EmergencyFund
    let dataService: DataService
    @State private var name: String
    @State private var targetAmount: String
    @State private var currentAmount: String
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showingDeleteAlert = false
    
    init(fund: EmergencyFund, dataService: DataService) {
        self.fund = fund
        self.dataService = dataService
        _name = State(initialValue: fund.name)
        _targetAmount = State(initialValue: String(format: "%.2f", fund.targetAmount))
        _currentAmount = State(initialValue: String(format: "%.2f", fund.currentAmount))
    }
    
    var body: some View {
        NavigationView {
            Form {
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                TextField("Fund Name", text: $name)
                TextField("Target Amount", text: $targetAmount)
                    .keyboardType(.decimalPad)
                TextField("Current Amount", text: $currentAmount)
                    .keyboardType(.decimalPad)
                
                Section {
                    Button(role: .destructive, action: { showingDeleteAlert = true }) {
                        HStack {
                            Image(systemName: "trash")
                            Text("Delete Fund")
                        }
                    }
                }
            }
            .navigationTitle("Edit Emergency Fund")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveFund()
                    }
                    .disabled(isSaving || name.isEmpty || targetAmount.isEmpty)
                }
            }
            .alert("Delete Fund", isPresented: $showingDeleteAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    deleteFund()
                }
            } message: {
                Text("Are you sure you want to delete '\(fund.name)'? This action cannot be undone.")
            }
        }
    }
    
    private func saveFund() {
        guard let target = Double(targetAmount), target > 0 else {
            errorMessage = "Please enter a valid target amount"
            return
        }
        
        let current = Double(currentAmount) ?? 0
        
        var funds: [EmergencyFund] = []
        if let data = UserDefaults.standard.data(forKey: "emergencyFunds"),
           let decoded = try? JSONDecoder().decode([EmergencyFund].self, from: data) {
            funds = decoded
        }
        
        if let index = funds.firstIndex(where: { $0.id == fund.id }) {
            funds[index].name = name
            funds[index].targetAmount = target
            funds[index].currentAmount = current
        }
        
        if let encoded = try? JSONEncoder().encode(funds) {
            UserDefaults.standard.set(encoded, forKey: "emergencyFunds")
            dismiss()
        } else {
            errorMessage = "Failed to save fund"
        }
    }
    
    private func deleteFund() {
        var funds: [EmergencyFund] = []
        if let data = UserDefaults.standard.data(forKey: "emergencyFunds"),
           let decoded = try? JSONDecoder().decode([EmergencyFund].self, from: data) {
            funds = decoded
        }
        
        funds.removeAll { $0.id == fund.id }
        
        if let encoded = try? JSONEncoder().encode(funds) {
            UserDefaults.standard.set(encoded, forKey: "emergencyFunds")
            dismiss()
        }
    }
}
