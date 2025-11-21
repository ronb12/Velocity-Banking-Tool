//
//  EnvelopeService.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-16.
//

import Foundation

class EnvelopeService: ObservableObject {
    private var dataService: DataService
    
    @Published var envelopes: [Envelope] = []
    @Published var monthlyIncome: MonthlyIncome?
    @Published var isEnvelopeMode: Bool = false
    
    init(dataService: DataService) {
        self.dataService = dataService
    }
    
    func updateDataService(_ newService: DataService) {
        self.dataService = newService
    }
    
    // MARK: - Zero-Based Budgeting
    
    /// Set monthly income for zero-based budgeting
    func setMonthlyIncome(_ income: MonthlyIncome) async throws {
        monthlyIncome = income
        try await dataService.saveMonthlyIncome(income)
    }
    
    /// Get available to allocate (Income - All Envelopes)
    func getAvailableToAllocate() -> Double {
        guard let income = monthlyIncome else { return 0 }
        let totalAllocated = envelopes.reduce(0) { $0 + $1.allocatedAmount }
        return income.totalIncome - totalAllocated
    }
    
    /// Check if all income is allocated (zero-based requirement)
    func isZeroBased() -> Bool {
        abs(getAvailableToAllocate()) < 0.01 // Allow small rounding differences
    }
    
    // MARK: - Envelope Management
    
    /// Allocate money to an envelope
    func allocateToEnvelope(_ envelopeId: String, amount: Double) async throws {
        guard let index = envelopes.firstIndex(where: { $0.id == envelopeId }) else { return }
        
        let available = getAvailableToAllocate()
        guard amount <= available else {
            throw EnvelopeError.insufficientFunds(available: available, requested: amount)
        }
        
        envelopes[index].allocatedAmount += amount
        // Persist the change
        try await dataService.saveEnvelope(envelopes[index])
    }
    
    /// Move money between envelopes
    func transferBetweenEnvelopes(from: String, to: String, amount: Double) async throws {
        guard let fromIndex = envelopes.firstIndex(where: { $0.id == from }),
              let toIndex = envelopes.firstIndex(where: { $0.id == to }) else {
            throw EnvelopeError.envelopeNotFound
        }
        
        guard envelopes[fromIndex].available >= amount else {
            throw EnvelopeError.insufficientFunds(available: envelopes[fromIndex].available, requested: amount)
        }
        
        envelopes[fromIndex].allocatedAmount -= amount
        envelopes[toIndex].allocatedAmount += amount
        
        // Persist both changes
        try await dataService.saveEnvelope(envelopes[fromIndex])
        try await dataService.saveEnvelope(envelopes[toIndex])
    }
    
    /// Check if spending is allowed (envelope has funds and is unlocked)
    func canSpend(category: String, amount: Double) -> (allowed: Bool, reason: String?) {
        guard isEnvelopeMode else {
            return (true, nil) // Tracking mode allows all spending
        }
        
        guard let envelope = envelopes.first(where: { $0.category == category }) else {
            return (false, "No envelope found for category")
        }
        
        if envelope.isLocked {
            return (false, "Envelope is locked. Unlock it before spending.")
        }
        
        if envelope.available < amount {
            return (false, "Insufficient funds in envelope. Available: \(formatCurrency(envelope.available))")
        }
        
        return (true, nil)
    }
    
    /// Record spending from envelope
    func recordSpending(category: String, amount: Double) async throws {
        guard let index = envelopes.firstIndex(where: { $0.category == category }) else {
            throw EnvelopeError.envelopeNotFound
        }
        
        guard envelopes[index].available >= amount else {
            throw EnvelopeError.insufficientFunds(available: envelopes[index].available, requested: amount)
        }
        
        envelopes[index].spentAmount += amount
        // Persist the change
        try await dataService.saveEnvelope(envelopes[index])
    }
    
    /// Lock/unlock envelope
    func toggleEnvelopeLock(_ envelopeId: String) async throws {
        guard let index = envelopes.firstIndex(where: { $0.id == envelopeId }) else { return }
        envelopes[index].isLocked.toggle()
        // Persist the change
        try await dataService.saveEnvelope(envelopes[index])
    }
    
    /// Create envelope from budget category
    func createEnvelopeFromBudget(_ budget: Budget) {
        let envelope = Envelope(
            category: budget.category,
            allocatedAmount: budget.budgetedAmount,
            spentAmount: budget.spentAmount,
            month: budget.month
        )
        envelopes.append(envelope)
    }
    
    /// Load envelopes for current month
    func loadEnvelopes(for month: Date) async throws {
        // Try to load from Core Data first
        let savedEnvelopes = try await dataService.fetchEnvelopes(for: month)
        if !savedEnvelopes.isEmpty {
            envelopes = savedEnvelopes
        } else {
            // If no saved envelopes, create from budgets
            let calendar = Calendar.current
            let monthStart = calendar.dateInterval(of: .month, for: month)?.start ?? month
            
            let budgets = try await dataService.fetchBudgets()
            envelopes = budgets
                .filter { calendar.isDate($0.month, equalTo: monthStart, toGranularity: .month) }
                .map { budget in
                    Envelope(
                        category: budget.category,
                        allocatedAmount: budget.budgetedAmount,
                        spentAmount: budget.spentAmount,
                        month: budget.month
                    )
                }
            // Save the created envelopes
            try await dataService.saveEnvelopes(envelopes)
        }
        
        // Load monthly income for the month
        if let income = try await dataService.fetchMonthlyIncome(for: month) {
            monthlyIncome = income
        }
    }
    
    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
    
    enum EnvelopeError: LocalizedError {
        case insufficientFunds(available: Double, requested: Double)
        case envelopeNotFound
        case incomeNotSet
        
        var errorDescription: String? {
            switch self {
            case .insufficientFunds(let available, let requested):
                return "Insufficient funds. Available: \(String(format: "%.2f", available)), Requested: \(String(format: "%.2f", requested))"
            case .envelopeNotFound:
                return "Envelope not found"
            case .incomeNotSet:
                return "Monthly income not set. Please set your income first."
            }
        }
    }
}

