//
//  EnvelopeQuickCheckView.swift
//  BradleysFinanceHub
//
//  Pre-purchase envelope balance checker
//

import SwiftUI

struct EnvelopeQuickCheckView: View {
    @ObservedObject var envelopeService: EnvelopeService
    @State private var selectedCategory: String = ""
    @State private var purchaseAmount: String = ""
    @State private var showResult = false
    @State private var canPurchase = false
    @State private var message = ""
    
    var categories: [String] {
        envelopeService.envelopes.map { $0.category }.sorted()
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "cart.badge.questionmark")
                        .font(.system(size: 48))
                        .foregroundColor(.blue)
                    Text("Check Before You Buy")
                        .font(.title2)
                        .fontWeight(.bold)
                    Text("Verify you have enough in your envelope")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 20)
                
                // Category Selection
                VStack(alignment: .leading, spacing: 8) {
                    Text("What are you buying?")
                        .font(.headline)
                    Picker("Category", selection: $selectedCategory) {
                        Text("Select Category").tag("")
                        ForEach(categories, id: \.self) { category in
                            HStack {
                                if let envelope = envelopeService.envelopes.first(where: { $0.category == category }) {
                                    Circle()
                                        .fill(envelope.status == .good ? Color.green : 
                                              envelope.status == .caution ? Color.yellow :
                                              envelope.status == .warning ? Color.orange : Color.red)
                                        .frame(width: 12, height: 12)
                                }
                                Text(category)
                            }
                            .tag(category)
                        }
                    }
                    .pickerStyle(.menu)
                }
                
                // Amount Input
                VStack(alignment: .leading, spacing: 8) {
                    Text("How much?")
                        .font(.headline)
                    TextField("$0.00", text: $purchaseAmount)
                        .keyboardType(.decimalPad)
                        .font(.title2)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                }
                
                // Check Button
                Button {
                    checkPurchase()
                } label: {
                    HStack {
                        Image(systemName: "checkmark.shield.fill")
                        Text("Check Envelope")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(selectedCategory.isEmpty || purchaseAmount.isEmpty ? Color.gray : Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(selectedCategory.isEmpty || purchaseAmount.isEmpty)
                
                // Result
                if showResult {
                    VStack(spacing: 16) {
                        Image(systemName: canPurchase ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .font(.system(size: 64))
                            .foregroundColor(canPurchase ? .green : .red)
                        
                        Text(message)
                            .font(.title3)
                            .fontWeight(.semibold)
                            .multilineTextAlignment(.center)
                        
                        if let envelope = envelopeService.envelopes.first(where: { $0.category == selectedCategory }) {
                            VStack(spacing: 8) {
                                HStack {
                                    Text("Available:")
                                        .foregroundColor(.secondary)
                                    Spacer()
                                    Text(formatCurrency(envelope.available))
                                        .font(.title2)
                                        .fontWeight(.bold)
                                        .foregroundColor(envelope.available > 0 ? .green : .red)
                                }
                                
                                if !canPurchase && envelope.available > 0 {
                                    Text("You need \(formatCurrency((Double(purchaseAmount) ?? 0) - envelope.available)) more")
                                        .font(.caption)
                                        .foregroundColor(.orange)
                                }
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                        }
                        
                        if !canPurchase {
                            Button {
                                // Show transfer options
                            } label: {
                                Text("Transfer from Another Envelope")
                                    .font(.subheadline)
                                    .foregroundColor(.blue)
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
                }
                
                Spacer()
            }
            .padding()
            .navigationTitle("Quick Check")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
    
    private func checkPurchase() {
        guard !selectedCategory.isEmpty,
              let amount = Double(purchaseAmount),
              amount > 0 else {
            return
        }
        
        let result = envelopeService.canSpend(category: selectedCategory, amount: amount)
        canPurchase = result.allowed
        message = result.allowed ? 
            "✅ You can make this purchase!" : 
            (result.reason ?? "Cannot make this purchase")
        showResult = true
    }
    
    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

// MARK: - Shopping Mode View
struct ShoppingModeView: View {
    @ObservedObject var envelopeService: EnvelopeService
    @State private var searchText = ""
    
    var filteredEnvelopes: [Envelope] {
        if searchText.isEmpty {
            return envelopeService.envelopes
        }
        return envelopeService.envelopes.filter { $0.category.localizedCaseInsensitiveContains(searchText) }
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "cart.fill")
                        .font(.system(size: 32))
                        .foregroundColor(.blue)
                    Text("Shopping Mode")
                        .font(.title2)
                        .fontWeight(.bold)
                    Text("Quick access to envelope balances")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color(.systemGray6))
                
                // Search
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)
                    TextField("Search category...", text: $searchText)
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .padding(.horizontal)
                .padding(.top, 8)
                
                // Envelope Cards
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(filteredEnvelopes) { envelope in
                            EnvelopeShoppingCard(envelope: envelope)
                        }
                    }
                    .padding()
                }
            }
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct EnvelopeShoppingCard: View {
    let envelope: Envelope
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(envelope.category)
                    .font(.headline)
                Spacer()
                if envelope.isLocked {
                    Image(systemName: "lock.fill")
                        .foregroundColor(.red)
                }
            }
            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Available")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(formatCurrency(envelope.available))
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(statusColor)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(String(format: "%.0f%%", envelope.percentageUsed)) used")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    ProgressView(value: min(envelope.spentAmount, envelope.allocatedAmount), total: envelope.allocatedAmount)
                        .tint(statusColor)
                        .frame(width: 100)
                }
            }
            
            if envelope.isLocked {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.orange)
                    Text("Envelope is locked")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
    
    var statusColor: Color {
        switch envelope.status {
        case .good: return .green
        case .caution: return .yellow
        case .warning: return .orange
        case .overBudget: return .red
        }
    }
    
    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

