//
//  MultiCurrencyService.swift
//  BradleysFinanceHub
//
//  Multi-currency support service
//

import Foundation

class MultiCurrencyService: ObservableObject {
    static let shared = MultiCurrencyService()
    
    @Published var baseCurrency: Currency = .usd
    @Published var exchangeRates: [Currency: Double] = [:]
    @Published var lastUpdated: Date?
    
    enum Currency: String, Codable, CaseIterable {
        case usd = "USD"
        case eur = "EUR"
        case gbp = "GBP"
        case jpy = "JPY"
        case cad = "CAD"
        case aud = "AUD"
        case chf = "CHF"
        case cny = "CNY"
        case inr = "INR"
        case mxn = "MXN"
        case brl = "BRL"
        case zar = "ZAR"
        case krw = "KRW"
        case sgd = "SGD"
        case hkd = "HKD"
        case nzd = "NZD"
        
        var symbol: String {
            switch self {
            case .usd: return "$"
            case .eur: return "€"
            case .gbp: return "£"
            case .jpy: return "¥"
            case .cad: return "C$"
            case .aud: return "A$"
            case .chf: return "CHF"
            case .cny: return "¥"
            case .inr: return "₹"
            case .mxn: return "Mex$"
            case .brl: return "R$"
            case .zar: return "R"
            case .krw: return "₩"
            case .sgd: return "S$"
            case .hkd: return "HK$"
            case .nzd: return "NZ$"
            }
        }
        
        var name: String {
            switch self {
            case .usd: return "US Dollar"
            case .eur: return "Euro"
            case .gbp: return "British Pound"
            case .jpy: return "Japanese Yen"
            case .cad: return "Canadian Dollar"
            case .aud: return "Australian Dollar"
            case .chf: return "Swiss Franc"
            case .cny: return "Chinese Yuan"
            case .inr: return "Indian Rupee"
            case .mxn: return "Mexican Peso"
            case .brl: return "Brazilian Real"
            case .zar: return "South African Rand"
            case .krw: return "South Korean Won"
            case .sgd: return "Singapore Dollar"
            case .hkd: return "Hong Kong Dollar"
            case .nzd: return "New Zealand Dollar"
            }
        }
    }
    
    private init() {
        loadExchangeRates()
    }
    
    func convert(amount: Double, from: Currency, to: Currency) -> Double {
        if from == to { return amount }
        
        // Convert to base currency first
        let baseAmount = from == baseCurrency ? amount : amount / (exchangeRates[from] ?? 1.0)
        
        // Convert to target currency
        return to == baseCurrency ? baseAmount : baseAmount * (exchangeRates[to] ?? 1.0)
    }
    
    func format(amount: Double, currency: Currency) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency.rawValue
        formatter.currencySymbol = currency.symbol
        return formatter.string(from: NSNumber(value: amount)) ?? "\(currency.symbol)\(String(format: "%.2f", amount))"
    }
    
    func updateExchangeRates() async throws {
        // In production, fetch from API (e.g., exchangerate-api.com, fixer.io)
        // For now, using mock rates
        
        let mockRates: [Currency: Double] = [
            .eur: 0.92,
            .gbp: 0.79,
            .jpy: 149.50,
            .cad: 1.35,
            .aud: 1.52,
            .chf: 0.88,
            .cny: 7.24,
            .inr: 83.12,
            .mxn: 17.05,
            .brl: 4.95,
            .zar: 18.75,
            .krw: 1320.50,
            .sgd: 1.34,
            .hkd: 7.82,
            .nzd: 1.68
        ]
        
        exchangeRates = mockRates
        lastUpdated = Date()
        
        // Save to UserDefaults
        saveExchangeRates()
    }
    
    private func loadExchangeRates() {
        // Load from UserDefaults or API
        // For now, using default rates
        Task {
            try? await updateExchangeRates()
        }
    }
    
    private func saveExchangeRates() {
        // Save to UserDefaults
        if let encoded = try? JSONEncoder().encode(exchangeRates) {
            UserDefaults.standard.set(encoded, forKey: "exchangeRates")
        }
        UserDefaults.standard.set(lastUpdated, forKey: "exchangeRatesLastUpdated")
    }
}

