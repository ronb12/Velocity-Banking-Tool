//
//  InvestmentTrackerView.swift
//  BradleysFinanceHub
//
//  Investment portfolio tracking view
//

import SwiftUI

struct InvestmentTrackerView: View {
    @EnvironmentObject var dataService: DataService
    @State private var investments: [Investment] = []
    @State private var showingAddInvestment = false
    @State private var selectedInvestment: Investment?
    @State private var isLoading = true
    
    var totalPortfolioValue: Double {
        investments.reduce(0) { $0 + $1.totalValue }
    }
    
    var totalGainLoss: Double {
        investments.reduce(0) { $0 + $1.totalGainLoss }
    }
    
    var totalGainLossPercent: Double {
        let totalCost = investments.reduce(0) { $0 + $1.totalCostBasis }
        guard totalCost > 0 else { return 0 }
        return (totalGainLoss / totalCost) * 100
    }
    
    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    ProgressView()
                } else if investments.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "chart.line.uptrend.xyaxis")
                            .font(.system(size: 50))
                            .foregroundColor(.secondary)
                        Text("No Investments Yet")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        Text("Tap the + button to add your first investment account")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        VStack(spacing: 20) {
                            // Portfolio Summary Card
                            PortfolioSummaryCard(
                                totalValue: totalPortfolioValue,
                                totalGainLoss: totalGainLoss,
                                totalGainLossPercent: totalGainLossPercent
                            )
                            
                            // Investment Accounts
                            ForEach(investments) { investment in
                                InvestmentAccountCard(
                                    investment: investment,
                                    onTap: {
                                        selectedInvestment = investment
                                    }
                                )
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Investments")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddInvestment = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddInvestment) {
                AddInvestmentView(dataService: dataService)
                    .onDisappear {
                        Task {
                            await loadInvestments()
                        }
                    }
            }
            .sheet(item: $selectedInvestment) { investment in
                InvestmentDetailView(investment: investment, dataService: dataService)
            }
            .task {
                await loadInvestments()
            }
        }
    }
    
    private func loadInvestments() async {
        // Load from DataService
        // For now, using mock data structure
        isLoading = false
    }
}

struct PortfolioSummaryCard: View {
    let totalValue: Double
    let totalGainLoss: Double
    let totalGainLossPercent: Double
    
    var body: some View {
        VStack(spacing: 16) {
            Text("Portfolio Value")
                .font(.headline)
                .foregroundColor(.secondary)
            
            Text("$\(String(format: "%.2f", totalValue))")
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(.primary)
            
            HStack(spacing: 20) {
                VStack(alignment: .leading) {
                    Text("Total Gain/Loss")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("$\(String(format: "%.2f", totalGainLoss))")
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(totalGainLoss >= 0 ? .green : .red)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("Return")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(String(format: "%.2f", totalGainLossPercent))%")
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(totalGainLossPercent >= 0 ? .green : .red)
                }
            }
        }
        .padding()
        .background(
            LinearGradient(
                gradient: Gradient(colors: [Color.blue.opacity(0.1), Color.purple.opacity(0.1)]),
                startPoint: .leading,
                endPoint: .trailing
            )
        )
        .cornerRadius(16)
    }
}

struct InvestmentAccountCard: View {
    let investment: Investment
    let onTap: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(investment.accountName)
                        .font(.headline)
                    Text(investment.accountType.rawValue)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("$\(String(format: "%.2f", investment.totalValue))")
                        .font(.title3)
                        .fontWeight(.bold)
                    
                    HStack(spacing: 4) {
                        Image(systemName: investment.totalGainLoss >= 0 ? "arrow.up.right" : "arrow.down.right")
                            .font(.caption2)
                        Text("\(String(format: "%.2f", investment.totalGainLossPercent))%")
                            .font(.caption)
                    }
                    .foregroundColor(investment.totalGainLoss >= 0 ? .green : .red)
                }
            }
            
            Divider()
            
            // Holdings Summary
            if !investment.holdings.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Holdings (\(investment.holdings.count))")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    
                    ForEach(investment.holdings.prefix(3)) { holding in
                        HoldingRow(holding: holding)
                    }
                    
                    if investment.holdings.count > 3 {
                        Text("+ \(investment.holdings.count - 3) more")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .onTapGesture {
            onTap()
        }
    }
}

struct HoldingRow: View {
    let holding: Holding
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(holding.symbol)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Text(holding.name)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                Text("$\(String(format: "%.2f", holding.currentValue))")
                    .font(.subheadline)
                Text("\(holding.gainLoss >= 0 ? "+" : "")\(String(format: "%.2f", holding.gainLossPercent))%")
                    .font(.caption2)
                    .foregroundColor(holding.gainLoss >= 0 ? .green : .red)
            }
        }
        .padding(.vertical, 4)
    }
}

struct AddInvestmentView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    @State private var accountName = ""
    @State private var accountType: Investment.InvestmentAccountType = .brokerage
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
                
                TextField("Account Name", text: $accountName)
                Picker("Account Type", selection: $accountType) {
                    ForEach(Investment.InvestmentAccountType.allCases, id: \.self) { type in
                        Text(type.rawValue).tag(type)
                    }
                }
            }
            .navigationTitle("Add Investment Account")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveInvestment()
                    }
                    .disabled(isSaving || accountName.isEmpty)
                }
            }
        }
    }
    
    private func saveInvestment() {
        guard !accountName.isEmpty else {
            errorMessage = "Please enter an account name"
            return
        }
        
        isSaving = true
        errorMessage = nil
        
        let investment = Investment(
            accountName: accountName,
            accountType: accountType
        )
        
        // Save to DataService
        Task {
            // Implementation needed
            await MainActor.run {
                isSaving = false
                dismiss()
            }
        }
    }
}

struct InvestmentDetailView: View {
    let investment: Investment
    let dataService: DataService
    @Environment(\.dismiss) var dismiss
    @State private var showingAddHolding = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Account Summary
                    VStack(spacing: 12) {
                        Text(investment.accountName)
                            .font(.title2)
                            .fontWeight(.bold)
                        Text(investment.accountType.rawValue)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        Text("$\(String(format: "%.2f", investment.totalValue))")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundColor(.primary)
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                    
                    // Holdings List
                    if !investment.holdings.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Holdings")
                                .font(.headline)
                                .padding(.horizontal)
                            
                            ForEach(investment.holdings) { holding in
                                HoldingDetailRow(holding: holding)
                                    .padding(.horizontal)
                            }
                        }
                    } else {
                        VStack(spacing: 16) {
                            Image(systemName: "chart.bar")
                                .font(.system(size: 50))
                                .foregroundColor(.secondary)
                            Text("No Holdings")
                                .font(.headline)
                                .foregroundColor(.secondary)
                            Text("Add your first holding to track your investments")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                        .padding()
                    }
                }
                .padding()
            }
            .navigationTitle("Investment Details")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddHolding = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddHolding) {
                AddHoldingView(investmentId: investment.id, dataService: dataService)
            }
        }
    }
}

struct HoldingDetailRow: View {
    let holding: Holding
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(holding.symbol)
                        .font(.headline)
                    Text(holding.name)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(holding.holdingType.rawValue)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            
            Divider()
            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Quantity")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(String(format: "%.2f", holding.quantity))")
                        .font(.subheadline)
                }
                
                Spacer()
                
                VStack(alignment: .center, spacing: 4) {
                    Text("Current Price")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("$\(String(format: "%.2f", holding.currentPrice))")
                        .font(.subheadline)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Value")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("$\(String(format: "%.2f", holding.currentValue))")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
            }
            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Cost Basis")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("$\(String(format: "%.2f", holding.costBasis))")
                        .font(.subheadline)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Gain/Loss")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("$\(String(format: "%.2f", holding.gainLoss))")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(holding.gainLoss >= 0 ? .green : .red)
                    Text("\(holding.gainLoss >= 0 ? "+" : "")\(String(format: "%.2f", holding.gainLossPercent))%")
                        .font(.caption2)
                        .foregroundColor(holding.gainLoss >= 0 ? .green : .red)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct AddHoldingView: View {
    let investmentId: String
    let dataService: DataService
    @Environment(\.dismiss) var dismiss
    @State private var symbol = ""
    @State private var name = ""
    @State private var quantity = ""
    @State private var currentPrice = ""
    @State private var costBasis = ""
    @State private var holdingType: Holding.HoldingType = .stock
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
                
                TextField("Symbol (e.g., AAPL)", text: $symbol)
                TextField("Name", text: $name)
                TextField("Quantity", text: $quantity)
                    .keyboardType(.decimalPad)
                TextField("Current Price", text: $currentPrice)
                    .keyboardType(.decimalPad)
                TextField("Cost Basis", text: $costBasis)
                    .keyboardType(.decimalPad)
                Picker("Type", selection: $holdingType) {
                    ForEach(Holding.HoldingType.allCases, id: \.self) { type in
                        Text(type.rawValue).tag(type)
                    }
                }
            }
            .navigationTitle("Add Holding")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveHolding()
                    }
                    .disabled(isSaving || symbol.isEmpty || name.isEmpty)
                }
            }
        }
    }
    
    private func saveHolding() {
        guard let qty = Double(quantity), qty > 0,
              let price = Double(currentPrice), price >= 0,
              let basis = Double(costBasis), basis >= 0 else {
            errorMessage = "Please enter valid numbers"
            return
        }
        
        isSaving = true
        errorMessage = nil
        
        let holding = Holding(
            symbol: symbol.uppercased(),
            name: name,
            quantity: qty,
            currentPrice: price,
            costBasis: basis,
            holdingType: holdingType
        )
        
        // Save to DataService
        Task {
            // Implementation needed
            await MainActor.run {
                isSaving = false
                dismiss()
            }
        }
    }
}

extension Investment.InvestmentAccountType: CaseIterable {}
extension Holding.HoldingType: CaseIterable {}

