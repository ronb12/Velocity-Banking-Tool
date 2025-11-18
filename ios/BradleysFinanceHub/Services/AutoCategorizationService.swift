//
//  AutoCategorizationService.swift
//  BradleysFinanceHub
//
//  Service to automatically categorize transactions based on merchant names and descriptions
//

import Foundation

class AutoCategorizationService {
    static let shared = AutoCategorizationService()
    
    private init() {}
    
    // Category patterns - merchant keywords mapped to categories
    private let categoryPatterns: [String: [String]] = [
        "Groceries": [
            "walmart", "target", "kroger", "safeway", "whole foods", "trader joe", "aldi",
            "costco", "sam's club", "publix", "wegmans", "food", "grocery", "supermarket",
            "market", "deli", "butcher", "bakery"
        ],
        "Dining Out": [
            "restaurant", "cafe", "coffee", "starbucks", "mcdonald", "burger", "pizza",
            "subway", "taco", "chipotle", "dunkin", "panera", "olive garden", "applebees",
            "dining", "eat", "food court", "fast food", "bar", "pub", "grill"
        ],
        "Transportation": [
            "gas", "shell", "exxon", "chevron", "bp", "mobil", "arco", "76",
            "uber", "lyft", "taxi", "parking", "metro", "transit", "bus", "train",
            "airline", "delta", "united", "american", "southwest", "car rental", "hertz",
            "avis", "enterprise"
        ],
        "Shopping": [
            "amazon", "ebay", "etsy", "best buy", "apple store", "nike", "adidas",
            "target", "walmart", "home depot", "lowes", "macy's", "nordstrom",
            "zara", "h&m", "forever 21", "shop", "store", "retail"
        ],
        "Entertainment": [
            "netflix", "spotify", "apple music", "hulu", "disney", "hbo", "prime video",
            "youtube", "twitch", "movie", "cinema", "theater", "concert", "ticketmaster",
            "stubhub", "game", "nintendo", "playstation", "xbox", "steam"
        ],
        "Utilities": [
            "electric", "power", "gas company", "water", "sewer", "trash", "waste",
            "internet", "comcast", "verizon", "at&t", "xfinity", "spectrum",
            "phone", "cellular", "mobile", "utility"
        ],
        "Healthcare": [
            "pharmacy", "cvs", "walgreens", "rite aid", "doctor", "hospital", "clinic",
            "medical", "dental", "vision", "optometrist", "dentist", "physician",
            "prescription", "medication", "health", "insurance"
        ],
        "Subscription": [
            "subscription", "monthly", "annual", "premium", "membership", "recurring"
        ],
        "Salary": [
            "salary", "payroll", "paycheck", "income", "wages", "direct deposit"
        ],
        "Bills": [
            "bill", "payment", "due", "invoice", "statement", "autopay"
        ],
        "Insurance": [
            "insurance", "geico", "state farm", "allstate", "progressive", "farmers"
        ],
        "Education": [
            "tuition", "school", "university", "college", "course", "textbook", "education"
        ],
        "Home": [
            "home depot", "lowes", "ikea", "furniture", "home improvement", "hardware"
        ]
    ]
    
    // Suggest category based on transaction description
    func suggestCategory(for description: String, amount: Double, type: Transaction.TransactionType) -> String? {
        let lowercased = description.lowercased()
        
        // For income, return Salary
        if type == .income {
            return "Salary"
        }
        
        // Check each category pattern
        for (category, patterns) in categoryPatterns {
            for pattern in patterns {
                if lowercased.contains(pattern) {
                    return category
                }
            }
        }
        
        // If no match found, return nil (user must select)
        return nil
    }
    
    // Get confidence score for category suggestion (0.0 to 1.0)
    func confidenceScore(for description: String, suggestedCategory: String) -> Double {
        let lowercased = description.lowercased()
        guard let patterns = categoryPatterns[suggestedCategory] else { return 0.0 }
        
        var matches = 0
        for pattern in patterns {
            if lowercased.contains(pattern) {
                matches += 1
            }
        }
        
        // Higher confidence if multiple patterns match
        return min(1.0, Double(matches) / Double(max(patterns.count, 1)) * 2.0)
    }
    
    // Learn from user's manual categorization (for future ML improvements)
    func learnCategory(description: String, category: String) {
        // This could be used to improve suggestions over time
        // For now, it's a placeholder for future ML integration
        print("📚 Learning: '\(description)' -> '\(category)'")
    }
    
    // Get all available categories
    func availableCategories() -> [String] {
        return Array(categoryPatterns.keys).sorted()
    }
}

