//
//  Investment.swift
//  BradleysFinanceHub
//
//  Investment tracking models
//

import Foundation

struct Investment: Identifiable, Codable {
    let id: String
    var accountName: String
    var accountType: InvestmentAccountType
    var totalValue: Double
    var holdings: [Holding]
    var createdAt: Date
    var lastUpdated: Date
    
    enum InvestmentAccountType: String, Codable {
        case brokerage = "Brokerage"
        case retirement = "Retirement"
        case rothIRA = "Roth IRA"
        case traditionalIRA = "Traditional IRA"
        case fourZeroOneK = "401(k)"
        case crypto = "Crypto"
        case other = "Other"
    }
    
    init(
        id: String = UUID().uuidString,
        accountName: String,
        accountType: InvestmentAccountType,
        totalValue: Double = 0,
        holdings: [Holding] = [],
        createdAt: Date = Date(),
        lastUpdated: Date = Date()
    ) {
        self.id = id
        self.accountName = accountName
        self.accountType = accountType
        self.totalValue = totalValue
        self.holdings = holdings
        self.createdAt = createdAt
        self.lastUpdated = lastUpdated
    }
    
    var totalCostBasis: Double {
        holdings.reduce(0) { $0 + $1.costBasis }
    }
    
    var totalGainLoss: Double {
        totalValue - totalCostBasis
    }
    
    var totalGainLossPercent: Double {
        guard totalCostBasis > 0 else { return 0 }
        return (totalGainLoss / totalCostBasis) * 100
    }
}

struct Holding: Identifiable, Codable {
    let id: String
    var symbol: String
    var name: String
    var quantity: Double
    var currentPrice: Double
    var costBasis: Double
    var purchaseDate: Date?
    var holdingType: HoldingType
    
    enum HoldingType: String, Codable {
        case stock = "Stock"
        case etf = "ETF"
        case mutualFund = "Mutual Fund"
        case bond = "Bond"
        case crypto = "Crypto"
        case other = "Other"
    }
    
    init(
        id: String = UUID().uuidString,
        symbol: String,
        name: String,
        quantity: Double,
        currentPrice: Double,
        costBasis: Double,
        purchaseDate: Date? = nil,
        holdingType: HoldingType = .stock
    ) {
        self.id = id
        self.symbol = symbol
        self.name = name
        self.quantity = quantity
        self.currentPrice = currentPrice
        self.costBasis = costBasis
        self.purchaseDate = purchaseDate
        self.holdingType = holdingType
    }
    
    var currentValue: Double {
        quantity * currentPrice
    }
    
    var gainLoss: Double {
        currentValue - costBasis
    }
    
    var gainLossPercent: Double {
        guard costBasis > 0 else { return 0 }
        return (gainLoss / costBasis) * 100
    }
}

