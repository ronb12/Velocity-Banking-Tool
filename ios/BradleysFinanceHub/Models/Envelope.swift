//
//  Envelope.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-16.
//

import Foundation

struct Envelope: Identifiable, Codable {
    var id: String
    var category: String
    var allocatedAmount: Double // Money actually allocated to this envelope
    var spentAmount: Double
    var month: Date
    var isLocked: Bool // If locked, spending is blocked
    var createdAt: Date
    
    init(id: String = UUID().uuidString, category: String, allocatedAmount: Double, spentAmount: Double = 0, month: Date = Date(), isLocked: Bool = false, createdAt: Date = Date()) {
        self.id = id
        self.category = category
        self.allocatedAmount = allocatedAmount
        self.spentAmount = spentAmount
        self.month = month
        self.isLocked = isLocked
        self.createdAt = createdAt
    }
    
    var available: Double {
        allocatedAmount - spentAmount
    }
    
    var isOverBudget: Bool {
        spentAmount > allocatedAmount
    }
    
    var percentageUsed: Double {
        guard allocatedAmount > 0 else { return 0 }
        return min((spentAmount / allocatedAmount) * 100, 100)
    }
    
    var status: EnvelopeStatus {
        if isOverBudget {
            return .overBudget
        } else if percentageUsed >= 90 {
            return .warning
        } else if percentageUsed >= 75 {
            return .caution
        } else {
            return .good
        }
    }
    
    enum EnvelopeStatus {
        case good
        case caution
        case warning
        case overBudget
        
        var color: String {
            switch self {
            case .good: return "green"
            case .caution: return "yellow"
            case .warning: return "orange"
            case .overBudget: return "red"
            }
        }
    }
}

struct MonthlyIncome: Identifiable, Codable {
    var id: String
    var month: Date
    var totalIncome: Double
    var incomeSources: [IncomeSource]
    var createdAt: Date
    
    struct IncomeSource: Identifiable, Codable {
        var id: String
        var name: String
        var amount: Double
        var category: String
        
        init(id: String = UUID().uuidString, name: String, amount: Double, category: String) {
            self.id = id
            self.name = name
            self.amount = amount
            self.category = category
        }
    }
    
    init(id: String = UUID().uuidString, month: Date = Date(), totalIncome: Double, incomeSources: [IncomeSource] = [], createdAt: Date = Date()) {
        self.id = id
        self.month = month
        self.totalIncome = totalIncome
        self.incomeSources = incomeSources
        self.createdAt = createdAt
    }
    
    var allocatedToEnvelopes: Double {
        // Will be calculated from envelopes
        return 0
    }
    
    var availableToAllocate: Double {
        totalIncome - allocatedToEnvelopes
    }
}

