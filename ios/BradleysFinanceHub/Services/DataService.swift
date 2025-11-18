//
//  DataService.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import Foundation
import CoreData
import Combine
import SwiftUI
import UIKit

// MARK: - AutoCategorizationService (included here because AutoCategorizationService.swift is not in Xcode project target)

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

// MARK: - Bill Model

struct Bill: Identifiable, Codable {
    var id: String
    var name: String
    var amount: Double
    var dueDate: Date
    var category: String
    var frequency: Frequency
    var isPaid: Bool
    var notes: String?
    var reminderDaysBefore: Int
    var createdAt: Date
    var lastPaidDate: Date?
    
    enum Frequency: String, Codable {
        case monthly = "monthly"
        case quarterly = "quarterly"
        case yearly = "yearly"
        case weekly = "weekly"
        case biweekly = "biweekly"
        
        var displayName: String {
            switch self {
            case .monthly: return "Monthly"
            case .quarterly: return "Quarterly"
            case .yearly: return "Yearly"
            case .weekly: return "Weekly"
            case .biweekly: return "Bi-weekly"
            }
        }
    }
    
    var isOverdue: Bool {
        !isPaid && dueDate < Date()
    }
    
    var daysUntilDue: Int {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.day], from: Date(), to: dueDate)
        return components.day ?? 0
    }
    
    var nextDueDate: Date {
        let calendar = Calendar.current
        switch frequency {
        case .monthly:
            return calendar.date(byAdding: .month, value: 1, to: dueDate) ?? dueDate
        case .quarterly:
            return calendar.date(byAdding: .month, value: 3, to: dueDate) ?? dueDate
        case .yearly:
            return calendar.date(byAdding: .year, value: 1, to: dueDate) ?? dueDate
        case .weekly:
            return calendar.date(byAdding: .day, value: 7, to: dueDate) ?? dueDate
        case .biweekly:
            return calendar.date(byAdding: .day, value: 14, to: dueDate) ?? dueDate
        }
    }
    
    init(
        id: String = UUID().uuidString,
        name: String,
        amount: Double,
        dueDate: Date,
        category: String,
        frequency: Frequency = .monthly,
        isPaid: Bool = false,
        notes: String? = nil,
        reminderDaysBefore: Int = 3,
        createdAt: Date = Date(),
        lastPaidDate: Date? = nil
    ) {
        self.id = id
        self.name = name
        self.amount = amount
        self.dueDate = dueDate
        self.category = category
        self.frequency = frequency
        self.isPaid = isPaid
        self.notes = notes
        self.reminderDaysBefore = reminderDaysBefore
        self.createdAt = createdAt
        self.lastPaidDate = lastPaidDate
    }
}

class DataService: ObservableObject {
	let context: NSManagedObjectContext
	private let encoder = JSONEncoder()
	private let decoder = JSONDecoder()
	
	init(context: NSManagedObjectContext) {
		self.context = context
		encoder.dateEncodingStrategy = .iso8601
		decoder.dateDecodingStrategy = .iso8601
	}
	
	// MARK: - Store Readiness Check
	
	private func ensureStoreIsReady() async throws {
		// Check if context has a coordinator
		guard let coordinator = context.persistentStoreCoordinator else {
			throw NSError(domain: "DataService", code: 1, userInfo: [NSLocalizedDescriptionKey: "No persistent store coordinator available"])
		}
		
		// If stores are already loaded, we're good
		if !coordinator.persistentStores.isEmpty {
			print("✅ Store is ready with \(coordinator.persistentStores.count) store(s)")
			return
		}
		
		// Wait for store to be loaded (max 15 seconds)
		var attempts = 0
		while coordinator.persistentStores.isEmpty && attempts < 150 {
			try await Task.sleep(nanoseconds: 100_000_000) // 0.1 seconds
			attempts += 1
		}
		
		// Final check
		if coordinator.persistentStores.isEmpty {
			// Log detailed error for debugging
			print("❌ Persistent store coordinator has no stores after waiting")
			print("   Coordinator: \(coordinator)")
			print("   Context: \(context)")
			print("   Has coordinator: \(context.persistentStoreCoordinator != nil)")
			
			// Try one more time with a longer wait
			try await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
			
			if coordinator.persistentStores.isEmpty {
				throw NSError(
					domain: "DataService",
					code: 2,
					userInfo: [NSLocalizedDescriptionKey: "Database not ready. Please close and reopen the app, or wait a moment and try again."]
				)
			}
		}
		
		print("✅ Store is ready with \(coordinator.persistentStores.count) store(s)")
	}
	
	// MARK: - Transaction Methods
	
	func saveTransaction(_ transaction: Transaction) async throws {
		print("💾 DataService: Starting saveTransaction for: \(transaction.description)")
		
		// Ensure store is ready before saving
		do {
			try await ensureStoreIsReady()
		} catch {
			print("❌ DataService: Store not ready: \(error.localizedDescription)")
			throw error
		}
		
		print("✅ DataService: Store is ready, proceeding with save")
		
		let existingEntity = fetchTransactionEntity(by: transaction.id)
		let isNew = existingEntity == nil
		print("📝 DataService: Transaction is \(isNew ? "new" : "existing")")
		
		let entity = existingEntity ?? TransactionEntity(context: context)
		entity.id = transaction.id
		entity.amount = transaction.amount
		entity.category = transaction.category
		entity.date = transaction.date
		entity.transactionDescription = transaction.description
		entity.type = transaction.type.rawValue
		entity.budgetId = transaction.budgetId
		entity.accountId = transaction.accountId
		if isNew {
			entity.createdAt = transaction.createdAt
		}
		
		// Serialize tags and splitTransactions to JSON
		if !transaction.tags.isEmpty {
			entity.tags = try? encoder.encode(transaction.tags).base64EncodedString()
		} else {
			entity.tags = nil
		}
		
		if !transaction.splitTransactions.isEmpty {
			entity.splitTransactions = try? encoder.encode(transaction.splitTransactions).base64EncodedString()
		} else {
			entity.splitTransactions = nil
		}
		
		// Update budget spentAmount if linked
		if let budgetId = transaction.budgetId, transaction.type == .expense {
			if let budgetEntity = fetchBudgetEntity(by: budgetId) {
				budgetEntity.spentAmount += transaction.amount
				
				// Schedule budget warning notification
				var thresholds: [Double] = [80, 100] // Default
				if let thresholdsData = budgetEntity.alertThresholds, let decoded = try? decoder.decode([Double].self, from: Data(base64Encoded: thresholdsData) ?? Data()) {
					thresholds = decoded
				}
				NotificationsManager.shared.scheduleBudgetWarningNotification(
					budgetId: budgetId,
					category: budgetEntity.category,
					spent: budgetEntity.spentAmount,
					budgeted: budgetEntity.budgetedAmount,
					thresholds: thresholds
				)
			}
		}
		
		// Create activity log only for new transactions
		if isNew {
			let activity = Activity(type: .transaction, description: "\(transaction.type.rawValue.capitalized): \(transaction.description)", amount: transaction.amount)
			try await saveActivity(activity)
		}
		
		print("💾 DataService: Calling context.save()...")
		do {
			try context.save()
			print("✅ DataService: Transaction saved successfully!")
		} catch {
			print("❌ DataService: context.save() failed: \(error.localizedDescription)")
			print("   Error details: \(error)")
			if let nsError = error as NSError? {
				print("   Domain: \(nsError.domain)")
				print("   Code: \(nsError.code)")
				print("   UserInfo: \(nsError.userInfo)")
			}
			throw error
		}
	}
	
	func fetchTransactions() async throws -> [Transaction] {
		let request = NSFetchRequest<TransactionEntity>(entityName: "TransactionEntity")
		request.sortDescriptors = [NSSortDescriptor(keyPath: \TransactionEntity.date, ascending: false)]
		let entities = try context.fetch(request)
		
		return entities.map { entity in
			var tags: [String] = []
			if let tagsData = entity.tags, let decoded = try? decoder.decode([String].self, from: Data(base64Encoded: tagsData) ?? Data()) {
				tags = decoded
			}
			
			var splits: [Transaction.SplitTransaction] = []
			if let splitsData = entity.splitTransactions, let decoded = try? decoder.decode([Transaction.SplitTransaction].self, from: Data(base64Encoded: splitsData) ?? Data()) {
				splits = decoded
			}
			
			return Transaction(
				id: entity.id,
				amount: entity.amount,
				category: entity.category,
				date: entity.date,
				description: entity.transactionDescription,
				type: Transaction.TransactionType(rawValue: entity.type) ?? .expense,
				budgetId: entity.budgetId,
				accountId: entity.accountId,
				tags: tags,
				splitTransactions: splits,
				createdAt: entity.createdAt
			)
		}
	}
	
	func deleteTransaction(_ transaction: Transaction) async throws {
		try await ensureStoreIsReady()
		
		if let entity = fetchTransactionEntity(by: transaction.id) {
			// Update budget if linked
			if let budgetId = transaction.budgetId, transaction.type == .expense {
				if let budgetEntity = fetchBudgetEntity(by: budgetId) {
					budgetEntity.spentAmount = max(0, budgetEntity.spentAmount - transaction.amount)
				}
			}
			context.delete(entity)
			try context.save()
		}
	}
	
	// MARK: - Budget Methods
	
	func saveBudget(_ budget: Budget) async throws {
		// Ensure store is ready before saving
		try await ensureStoreIsReady()
		
		let entity = fetchBudgetEntity(by: budget.id) ?? BudgetEntity(context: context)
		entity.id = budget.id
		entity.category = budget.category
		entity.budgetedAmount = budget.budgetedAmount
		entity.spentAmount = budget.spentAmount
		entity.month = budget.month
		entity.createdAt = budget.createdAt
		
		// Serialize alertThresholds to JSON
		entity.alertThresholds = try? encoder.encode(budget.alertThresholds).base64EncodedString()
		
		try context.save()
	}
	
	func fetchBudgets() async throws -> [Budget] {
		let request = NSFetchRequest<BudgetEntity>(entityName: "BudgetEntity")
		request.sortDescriptors = [NSSortDescriptor(keyPath: \BudgetEntity.month, ascending: false)]
		let entities = try context.fetch(request)
		
		return entities.map { entity in
			var thresholds: [Double] = [80, 100] // Default
			if let thresholdsData = entity.alertThresholds, let decoded = try? decoder.decode([Double].self, from: Data(base64Encoded: thresholdsData) ?? Data()) {
				thresholds = decoded
			}
			return Budget(
				id: entity.id,
				category: entity.category,
				budgetedAmount: entity.budgetedAmount,
				spentAmount: entity.spentAmount,
				month: entity.month,
				alertThresholds: thresholds,
				createdAt: entity.createdAt
			)
		}
	}
	
	func deleteBudget(_ budget: Budget) async throws {
		try await ensureStoreIsReady()
		
		if let entity = fetchBudgetEntity(by: budget.id) {
			context.delete(entity)
			try context.save()
		}
	}
	
	// MARK: - Debt Methods
	
	func saveDebt(_ debt: Debt) async throws {
		// Ensure store is ready before saving
		try await ensureStoreIsReady()
		
		let existingEntity = fetchDebtEntity(by: debt.id)
		let isNew = existingEntity == nil
		let entity = existingEntity ?? DebtEntity(context: context)
		entity.id = debt.id
		entity.name = debt.name
		entity.balance = debt.balance
		entity.interestRate = debt.interestRate
		entity.minimumPayment = debt.minimumPayment
		entity.dueDate = debt.dueDate
		if isNew {
			entity.createdAt = debt.createdAt
		}
		
		// Create activity log only for new debts
		if isNew {
			let activity = Activity(type: .debtCreated, description: "Debt created: \(debt.name)", amount: debt.balance)
			try await saveActivity(activity)
		}
		
		try context.save()
	}
	
	func fetchDebts() async throws -> [Debt] {
		try await ensureStoreIsReady()
		
		let request = NSFetchRequest<DebtEntity>(entityName: "DebtEntity")
		request.sortDescriptors = [NSSortDescriptor(keyPath: \DebtEntity.createdAt, ascending: false)]
		let entities = try context.fetch(request)
		
		print("📊 Fetched \(entities.count) debts")
		
		return entities.map { Debt(
			id: $0.id,
			name: $0.name,
			balance: $0.balance,
			interestRate: $0.interestRate,
			minimumPayment: $0.minimumPayment,
			dueDate: $0.dueDate,
			createdAt: $0.createdAt
		)}
	}
	
	func deleteDebt(_ debt: Debt) async throws {
		try await ensureStoreIsReady()
		
		if let entity = fetchDebtEntity(by: debt.id) {
			context.delete(entity)
			try context.save()
		}
	}
	
	// MARK: - Debt Payment Methods
	
	func saveDebtPayment(_ payment: DebtPayment) async throws {
		try await ensureStoreIsReady()
		
		let entity = DebtPaymentEntity(context: context)
		entity.id = payment.id
		entity.debtId = payment.debtId
		entity.amount = payment.amount
		entity.date = payment.date
		entity.notes = payment.notes
		entity.createdAt = payment.createdAt
		
		// Update debt balance
		if let debtEntity = fetchDebtEntity(by: payment.debtId) {
			debtEntity.balance = max(0, debtEntity.balance - payment.amount)
			
			// Check if paid off
			if debtEntity.balance <= 0 {
				let activity = Activity(type: .debtPaidOff, description: "Debt paid off: \(debtEntity.name)", amount: nil)
				try await saveActivity(activity)
			} else {
				let activity = Activity(type: .debtPayment, description: "Payment to \(debtEntity.name)", amount: payment.amount)
				try await saveActivity(activity)
			}
		}
		
		try context.save()
	}
	
	func fetchDebtPayments() async throws -> [DebtPayment] {
		let request = NSFetchRequest<DebtPaymentEntity>(entityName: "DebtPaymentEntity")
		request.sortDescriptors = [NSSortDescriptor(keyPath: \DebtPaymentEntity.date, ascending: false)]
		let entities = try context.fetch(request)
		
		return entities.map { DebtPayment(
			id: $0.id,
			debtId: $0.debtId,
			amount: $0.amount,
			date: $0.date,
			notes: $0.notes,
			createdAt: $0.createdAt
		)}
	}
	
	// MARK: - Savings Goal Methods
	
	func saveSavingsGoal(_ goal: SavingsGoal) async throws {
		// Ensure store is ready before saving
		try await ensureStoreIsReady()
		
		let existingEntity = fetchSavingsGoalEntity(by: goal.id)
		let isNew = existingEntity == nil
		let entity = existingEntity ?? SavingsGoalEntity(context: context)
		entity.id = goal.id
		entity.name = goal.name
		entity.targetAmount = goal.targetAmount
		entity.currentAmount = goal.currentAmount
		entity.targetDate = goal.targetDate
		entity.priority = Int32(goal.priority)
		if isNew {
			entity.createdAt = goal.createdAt
		}
		
		// Create activity log only for new goals
		if isNew {
			let activity = Activity(type: .goalCreated, description: "Goal created: \(goal.name)", amount: goal.targetAmount)
			try await saveActivity(activity)
		}
		
		try context.save()
	}
	
	func fetchSavingsGoals() async throws -> [SavingsGoal] {
		try await ensureStoreIsReady()
		
		let request = NSFetchRequest<SavingsGoalEntity>(entityName: "SavingsGoalEntity")
		request.sortDescriptors = [NSSortDescriptor(keyPath: \SavingsGoalEntity.priority, ascending: true), NSSortDescriptor(keyPath: \SavingsGoalEntity.createdAt, ascending: false)]
		let entities = try context.fetch(request)
		
		print("📊 Fetched \(entities.count) savings goals")
		
		return entities.map { SavingsGoal(
			id: $0.id,
			name: $0.name,
			targetAmount: $0.targetAmount,
			currentAmount: $0.currentAmount,
			targetDate: $0.targetDate,
			priority: Int($0.priority),
			createdAt: $0.createdAt
		)}
	}
	
	func deleteSavingsGoal(_ goal: SavingsGoal) async throws {
		try await ensureStoreIsReady()
		
		if let entity = fetchSavingsGoalEntity(by: goal.id) {
			context.delete(entity)
			try context.save()
		}
	}
	
	// MARK: - Savings Contribution Methods
	
	func saveSavingsContribution(_ contribution: SavingsContribution) async throws {
		try await ensureStoreIsReady()
		
		let entity = SavingsContributionEntity(context: context)
		entity.id = contribution.id
		entity.goalId = contribution.goalId
		entity.amount = contribution.amount
		entity.date = contribution.date
		entity.notes = contribution.notes
		entity.createdAt = contribution.createdAt
		
		// Update goal currentAmount
		if let goalEntity = fetchSavingsGoalEntity(by: contribution.goalId) {
			goalEntity.currentAmount += contribution.amount
			
			// Check if completed
			if goalEntity.currentAmount >= goalEntity.targetAmount {
				let activity = Activity(type: .goalCompleted, description: "Goal completed: \(goalEntity.name)", amount: nil)
				try await saveActivity(activity)
			} else {
				let activity = Activity(type: .goalContribution, description: "Contribution to \(goalEntity.name)", amount: contribution.amount)
				try await saveActivity(activity)
			}
		}
		
		try context.save()
	}
	
	func fetchSavingsContributions() async throws -> [SavingsContribution] {
		let request = NSFetchRequest<SavingsContributionEntity>(entityName: "SavingsContributionEntity")
		request.sortDescriptors = [NSSortDescriptor(keyPath: \SavingsContributionEntity.date, ascending: false)]
		let entities = try context.fetch(request)
		
		return entities.map { SavingsContribution(
			id: $0.id,
			goalId: $0.goalId,
			amount: $0.amount,
			date: $0.date,
			notes: $0.notes,
			createdAt: $0.createdAt
		)}
	}
	
	// MARK: - Net Worth Methods
	
	func saveNetWorth(_ netWorth: NetWorth) async throws {
		let entity = NetWorthEntity(context: context)
		entity.id = netWorth.id
		entity.date = netWorth.date
		entity.assets = netWorth.assets
		entity.liabilities = netWorth.liabilities
		
		// Create activity log
		let activity = Activity(type: .netWorthUpdate, description: "Net worth updated: $\(Int(netWorth.netWorth))", amount: netWorth.netWorth)
		try await saveActivity(activity)
		
		try context.save()
	}
	
	func fetchNetWorthHistory() async throws -> [NetWorth] {
		let request = NSFetchRequest<NetWorthEntity>(entityName: "NetWorthEntity")
		request.sortDescriptors = [NSSortDescriptor(keyPath: \NetWorthEntity.date, ascending: false)]
		let entities = try context.fetch(request)
		
		return entities.map { NetWorth(
			id: $0.id,
			assets: $0.assets,
			liabilities: $0.liabilities,
			date: $0.date
		)}
	}
	
	// MARK: - Activity Methods
	
	func saveActivity(_ activity: Activity) async throws {
		// Note: saveActivity is called from other save methods that already check store readiness
		// But we'll check here too for safety
		if context.persistentStoreCoordinator?.persistentStores.isEmpty == true {
			// If store isn't ready, skip activity logging rather than failing the save
			print("⚠️ Store not ready for activity log, skipping")
			return
		}
		
		let entity = ActivityEntity(context: context)
		entity.id = activity.id
		entity.type = activity.type.rawValue
		entity.activityDescription = activity.description
		entity.amount = activity.amount ?? 0
		entity.date = activity.date
		
		try context.save()
	}
	
	func fetchActivities() async throws -> [Activity] {
		let request = NSFetchRequest<ActivityEntity>(entityName: "ActivityEntity")
		request.sortDescriptors = [NSSortDescriptor(keyPath: \ActivityEntity.date, ascending: false)]
		let entities = try context.fetch(request)
		
		return entities.map { Activity(
			id: $0.id,
			type: Activity.ActivityType(rawValue: $0.type) ?? .transaction,
			description: $0.activityDescription,
			amount: $0.amount > 0 ? $0.amount : nil,
			date: $0.date
		)}
	}
	
	// MARK: - Helper Methods
	
	private func fetchTransactionEntity(by id: String) -> TransactionEntity? {
		let request = NSFetchRequest<TransactionEntity>(entityName: "TransactionEntity")
		request.predicate = NSPredicate(format: "id == %@", id)
		return try? context.fetch(request).first
	}
	
	private func fetchBudgetEntity(by id: String) -> BudgetEntity? {
		let request = NSFetchRequest<BudgetEntity>(entityName: "BudgetEntity")
		request.predicate = NSPredicate(format: "id == %@", id)
		return try? context.fetch(request).first
	}
	
	private func fetchDebtEntity(by id: String) -> DebtEntity? {
		let request = NSFetchRequest<DebtEntity>(entityName: "DebtEntity")
		request.predicate = NSPredicate(format: "id == %@", id)
		return try? context.fetch(request).first
	}
	
	private func fetchSavingsGoalEntity(by id: String) -> SavingsGoalEntity? {
		let request = NSFetchRequest<SavingsGoalEntity>(entityName: "SavingsGoalEntity")
		request.predicate = NSPredicate(format: "id == %@", id)
		return try? context.fetch(request).first
	}
	
	// MARK: - Bill Methods
	
	func saveBill(_ bill: Bill) async throws {
		try await ensureStoreIsReady()
		
		let existingEntity = fetchBillEntity(by: bill.id)
		let isNew = existingEntity == nil
		let entity = existingEntity ?? BillEntity(context: context)
		entity.id = bill.id
		entity.name = bill.name
		entity.amount = bill.amount
		entity.dueDate = bill.dueDate
		entity.category = bill.category
		entity.frequency = bill.frequency.rawValue
		entity.isPaid = bill.isPaid
		entity.notes = bill.notes
		entity.reminderDaysBefore = Int32(bill.reminderDaysBefore)
		if isNew {
			entity.createdAt = bill.createdAt
		}
		entity.lastPaidDate = bill.lastPaidDate
		
		// Schedule reminder if not paid
		if !bill.isPaid {
			let reminderDate = Calendar.current.date(byAdding: .day, value: -Int(bill.reminderDaysBefore), to: bill.dueDate) ?? bill.dueDate
			NotificationsManager.shared.scheduleBillReminder(
				billId: bill.id,
				billName: bill.name,
				amount: bill.amount,
				dueDate: bill.dueDate,
				reminderDate: reminderDate
			)
		}
		
		try context.save()
	}
	
	func fetchBills() async throws -> [Bill] {
		let request = NSFetchRequest<BillEntity>(entityName: "BillEntity")
		request.sortDescriptors = [NSSortDescriptor(keyPath: \BillEntity.dueDate, ascending: true)]
		let entities = try context.fetch(request)
		
		return entities.map { entity in
			Bill(
				id: entity.id,
				name: entity.name,
				amount: entity.amount,
				dueDate: entity.dueDate,
				category: entity.category,
				frequency: Bill.Frequency(rawValue: entity.frequency) ?? .monthly,
				isPaid: entity.isPaid,
				notes: entity.notes,
				reminderDaysBefore: Int(entity.reminderDaysBefore),
				createdAt: entity.createdAt,
				lastPaidDate: entity.lastPaidDate
			)
		}
	}
	
	func deleteBill(_ bill: Bill) async throws {
		try await ensureStoreIsReady()
		
		if let entity = fetchBillEntity(by: bill.id) {
			// Cancel reminder
			NotificationsManager.shared.cancelNotification(identifier: "bill-\(bill.id)")
			context.delete(entity)
			try context.save()
		}
	}
	
	func markBillAsPaid(_ bill: Bill) async throws {
		var updatedBill = bill
		updatedBill.isPaid = true
		updatedBill.lastPaidDate = Date()
		
		// Cancel reminder
		NotificationsManager.shared.cancelNotification(identifier: "bill-\(bill.id)")
		
		// If recurring, create next bill
		let calendar = Calendar.current
		let shouldCreateNext = bill.frequency != Bill.Frequency.yearly || 
			calendar.component(.year, from: bill.dueDate) == calendar.component(.year, from: Date())
		
		if shouldCreateNext {
			let nextBill = Bill(
				name: bill.name,
				amount: bill.amount,
				dueDate: bill.nextDueDate,
				category: bill.category,
				frequency: bill.frequency,
				isPaid: false,
				notes: bill.notes,
				reminderDaysBefore: bill.reminderDaysBefore
			)
			try await saveBill(nextBill)
		}
		
		try await saveBill(updatedBill)
	}
	
	private func fetchBillEntity(by id: String) -> BillEntity? {
		let request = NSFetchRequest<BillEntity>(entityName: "BillEntity")
		request.predicate = NSPredicate(format: "id == %@", id)
		return try? context.fetch(request).first
	}
	
	// MARK: - Recurring Transaction Methods
	
	func saveRecurringTransaction(_ recurring: RecurringTransaction) async throws {
		try await ensureStoreIsReady()
		
		let existingEntity = fetchRecurringTransactionEntity(by: recurring.id)
		let isNew = existingEntity == nil
		let entity = existingEntity ?? RecurringTransactionEntity(context: context)
		
		entity.id = recurring.id
		entity.name = recurring.name
		entity.amount = recurring.amount
		entity.category = recurring.category
		entity.type = recurring.type.rawValue
		entity.frequency = recurring.frequency.rawValue
		entity.startDate = recurring.nextDate // Using nextDate as startDate for now
		entity.nextDueDate = recurring.nextDate
		entity.isActive = recurring.isActive
		entity.accountId = nil
		entity.budgetId = nil
		if isNew {
			entity.createdAt = recurring.createdAt
		}
		
		try context.save()
	}
	
	func fetchRecurringTransactions() async throws -> [RecurringTransaction] {
		let request = NSFetchRequest<RecurringTransactionEntity>(entityName: "RecurringTransactionEntity")
		request.predicate = NSPredicate(format: "isActive == YES")
		request.sortDescriptors = [NSSortDescriptor(keyPath: \RecurringTransactionEntity.nextDueDate, ascending: true)]
		let entities = try context.fetch(request)
		
		return entities.map { entity in
			RecurringTransaction(
				id: entity.id,
				name: entity.name,
				amount: entity.amount,
				category: entity.category,
				type: Transaction.TransactionType(rawValue: entity.type) ?? .expense,
				frequency: RecurringTransaction.Frequency(rawValue: entity.frequency) ?? .monthly,
				nextDate: entity.nextDueDate,
				isActive: entity.isActive,
				createdAt: entity.createdAt
			)
		}
	}
	
	func deleteRecurringTransaction(_ recurring: RecurringTransaction) async throws {
		try await ensureStoreIsReady()
		
		if let entity = fetchRecurringTransactionEntity(by: recurring.id) {
			context.delete(entity)
			try context.save()
		}
	}
	
	private func fetchRecurringTransactionEntity(by id: String) -> RecurringTransactionEntity? {
		let request = NSFetchRequest<RecurringTransactionEntity>(entityName: "RecurringTransactionEntity")
		request.predicate = NSPredicate(format: "id == %@", id)
		return try? context.fetch(request).first
	}
}

// MARK: - HapticFeedback and Toast (included here because UserFeedback.swift may not be in Xcode project target)

struct HapticFeedback {
	static func success() {
		let generator = UINotificationFeedbackGenerator()
		generator.notificationOccurred(.success)
	}
	
	static func error() {
		let generator = UINotificationFeedbackGenerator()
		generator.notificationOccurred(.error)
	}
	
	static func warning() {
		let generator = UINotificationFeedbackGenerator()
		generator.notificationOccurred(.warning)
	}
	
	static func light() {
		let generator = UIImpactFeedbackGenerator(style: .light)
		generator.impactOccurred()
	}
	
	static func medium() {
		let generator = UIImpactFeedbackGenerator(style: .medium)
		generator.impactOccurred()
	}
	
	static func heavy() {
		let generator = UIImpactFeedbackGenerator(style: .heavy)
		generator.impactOccurred()
	}
}

// MARK: - Toast Modifier

struct ToastModifier: ViewModifier {
	@Binding var message: String?
	@State private var isShowing = false
	
	func body(content: Content) -> some View {
		ZStack {
			content
			
			if isShowing, let message = message {
				VStack {
					Spacer()
					HStack {
						Text(message)
							.font(.subheadline)
							.foregroundColor(.white)
							.padding(.horizontal, 16)
							.padding(.vertical, 12)
							.background(Color.black.opacity(0.8))
							.cornerRadius(10)
					}
					.padding(.bottom, 50)
				}
				.transition(.move(edge: .bottom).combined(with: .opacity))
				.animation(.spring(response: 0.3), value: isShowing)
			}
		}
		.onChange(of: message) { oldValue, newValue in
			if newValue != nil {
				isShowing = true
				// Auto-dismiss after 2 seconds
				DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
					isShowing = false
					DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
						self.message = nil
					}
				}
			}
		}
	}
}

extension View {
	func toast(message: Binding<String?>) -> some View {
		modifier(ToastModifier(message: message))
	}
}

// MARK: - PlaidService (included here because PlaidService.swift is not in Xcode project target)

// Real Plaid SDK integration for bank account linking
// Note: Add Plaid Link SDK via SPM: https://github.com/plaid/plaid-link-ios

class PlaidService: ObservableObject {
	static let shared = PlaidService()
	
	@Published var linkedAccounts: [LinkedAccount] = []
	@Published var isLinking: Bool = false
	@Published var errorMessage: String?
	
	// Plaid Configuration
	private var plaidClientId: String {
		return ProcessInfo.processInfo.environment["PLAID_CLIENT_ID"] ?? ""
	}
	
	private var plaidSecret: String {
		return ProcessInfo.processInfo.environment["PLAID_SECRET"] ?? ""
	}
	
	private var plaidEnvironment: PlaidEnvironment = .sandbox
	
	private var backendBaseURL: String {
		return ProcessInfo.processInfo.environment["PLAID_BACKEND_URL"] ?? "https://your-backend.com/api"
	}
	
	enum PlaidEnvironment: String {
		case sandbox = "sandbox"
		case development = "development"
		case production = "production"
		
		var apiURL: String {
			switch self {
			case .sandbox: return "https://sandbox.plaid.com"
			case .development: return "https://development.plaid.com"
			case .production: return "https://production.plaid.com"
			}
		}
	}
	
	private init() {
		loadPlaidCredentials()
	}
	
	private func loadPlaidCredentials() {
		if let env = UserDefaults.standard.string(forKey: "plaidEnvironment") {
			plaidEnvironment = PlaidEnvironment(rawValue: env) ?? .sandbox
		}
	}
	
	// MARK: - Link Bank Account (Real Plaid SDK)
	
	func linkBankAccount(presentingViewController: UIViewController, completion: @escaping (Result<LinkedAccount, Error>) -> Void) {
		isLinking = true
		errorMessage = nil
		
		Task {
			do {
				let linkToken = try await getLinkToken()
				
				await MainActor.run {
					self.initializePlaidLink(
						linkToken: linkToken,
						presentingViewController: presentingViewController,
						completion: completion
					)
				}
			} catch {
				await MainActor.run {
					self.isLinking = false
					self.errorMessage = error.localizedDescription
					completion(.failure(error))
				}
			}
		}
	}
	
	private func initializePlaidLink(
		linkToken: String,
		presentingViewController: UIViewController,
		completion: @escaping (Result<LinkedAccount, Error>) -> Void
	) {
		// Real Plaid Link SDK implementation
		// Uncomment after adding Plaid SDK via SPM and uncommenting import LinkKit
		
		/*
		var linkConfiguration = LinkTokenConfiguration(
			token: linkToken,
			onSuccess: { [weak self] publicToken, metadata in
				guard let self = self else { return }
				
				Task {
					do {
						let accessToken = try await self.exchangePublicToken(publicToken: publicToken)
						let account = try await self.fetchAccountInfo(
							accessToken: accessToken,
							institutionName: metadata.institution?.name ?? "Unknown",
							accounts: metadata.accounts
						)
						
						await MainActor.run {
							self.linkedAccounts.append(account)
							self.isLinking = false
							completion(.success(account))
						}
					} catch {
						await MainActor.run {
							self.isLinking = false
							self.errorMessage = error.localizedDescription
							completion(.failure(error))
						}
					}
				}
			}
		)
		
		let result = Plaid.create(linkConfiguration)
		switch result {
		case .success(let handler):
			handler.open(presentingFrom: presentingViewController)
		case .failure(let error):
			isLinking = false
			errorMessage = error.localizedDescription
			completion(.failure(error))
		}
		*/
		
		// Temporary: Fallback to mock for testing until SDK is added
		DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
			let mockAccount = LinkedAccount(
				id: UUID().uuidString,
				institutionName: "Chase Bank",
				accountName: "Chase Checking",
				accountType: .checking,
				accountNumber: "****1234",
				balance: 0,
				isLinked: true,
				lastSynced: Date()
			)
			self.linkedAccounts.append(mockAccount)
			self.isLinking = false
			completion(.success(mockAccount))
		}
	}
	
	// MARK: - Backend API Calls
	
	private func getLinkToken() async throws -> String {
		guard let url = URL(string: "\(backendBaseURL)/plaid/create-link-token") else {
			throw PlaidError.invalidURL
		}
		
		var request = URLRequest(url: url)
		request.httpMethod = "POST"
		request.setValue("application/json", forHTTPHeaderField: "Content-Type")
		
		let body: [String: Any] = [
			"client_id": plaidClientId,
			"secret": plaidSecret,
			"client_name": "Bradley's Finance Hub",
			"products": ["transactions", "auth"],
			"country_codes": ["US"],
			"language": "en"
		]
		
		request.httpBody = try JSONSerialization.data(withJSONObject: body)
		
		let (data, response) = try await URLSession.shared.data(for: request)
		
		guard let httpResponse = response as? HTTPURLResponse,
			  httpResponse.statusCode == 200 else {
			throw PlaidError.apiError("Failed to create link token")
		}
		
		let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
		guard let linkToken = json?["link_token"] as? String else {
			throw PlaidError.apiError("Invalid response from backend")
		}
		
		return linkToken
	}
	
	private func exchangePublicToken(publicToken: String) async throws -> String {
		guard let url = URL(string: "\(backendBaseURL)/plaid/exchange-token") else {
			throw PlaidError.invalidURL
		}
		
		var request = URLRequest(url: url)
		request.httpMethod = "POST"
		request.setValue("application/json", forHTTPHeaderField: "Content-Type")
		
		let body: [String: Any] = [
			"public_token": publicToken
		]
		
		request.httpBody = try JSONSerialization.data(withJSONObject: body)
		
		let (data, response) = try await URLSession.shared.data(for: request)
		
		guard let httpResponse = response as? HTTPURLResponse,
			  httpResponse.statusCode == 200 else {
			throw PlaidError.apiError("Failed to exchange token")
		}
		
		let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
		guard let accessToken = json?["access_token"] as? String else {
			throw PlaidError.apiError("Invalid response from backend")
		}
		
		saveAccessToken(accessToken, for: publicToken)
		return accessToken
	}
	
	func syncTransactions(for accountId: String) async throws -> [ImportedTransaction] {
		guard linkedAccounts.first(where: { $0.id == accountId }) != nil,
			  let accessToken = getAccessToken(for: accountId) else {
			throw PlaidError.accountNotFound
		}
		
		guard let url = URL(string: "\(backendBaseURL)/plaid/transactions") else {
			throw PlaidError.invalidURL
		}
		
		var request = URLRequest(url: url)
		request.httpMethod = "POST"
		request.setValue("application/json", forHTTPHeaderField: "Content-Type")
		
		let body: [String: Any] = [
			"access_token": accessToken,
			"start_date": ISO8601DateFormatter().string(from: Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()),
			"end_date": ISO8601DateFormatter().string(from: Date())
		]
		
		request.httpBody = try JSONSerialization.data(withJSONObject: body)
		
		let (data, response) = try await URLSession.shared.data(for: request)
		
		guard let httpResponse = response as? HTTPURLResponse,
			  httpResponse.statusCode == 200 else {
			throw PlaidError.apiError("Failed to fetch transactions")
		}
		
		let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
		guard let transactions = json?["transactions"] as? [[String: Any]] else {
			throw PlaidError.apiError("Invalid response format")
		}
		
		let importedTransactions = transactions.compactMap { transaction -> ImportedTransaction? in
			guard let amount = transaction["amount"] as? Double,
				  let dateString = transaction["date"] as? String,
				  let date = ISO8601DateFormatter().date(from: dateString),
				  let name = transaction["name"] as? String else {
				return nil
			}
			
			let category = (transaction["category"] as? [String])?.first ?? "Uncategorized"
			let merchant = transaction["merchant_name"] as? String
			
			return ImportedTransaction(
				id: transaction["transaction_id"] as? String ?? UUID().uuidString,
				accountId: accountId,
				amount: abs(amount),
				date: date,
				description: name,
				category: category,
				merchant: merchant,
				type: amount < 0 ? .expense : .income
			)
		}
		
		if let index = linkedAccounts.firstIndex(where: { $0.id == accountId }) {
			linkedAccounts[index].lastSynced = Date()
		}
		
		return importedTransactions
	}
	
	func getAccountBalance(for accountId: String) async throws -> Double {
		guard let account = linkedAccounts.first(where: { $0.id == accountId }),
			  let accessToken = getAccessToken(for: accountId) else {
			throw PlaidError.accountNotFound
		}
		
		guard let url = URL(string: "\(backendBaseURL)/plaid/accounts") else {
			throw PlaidError.invalidURL
		}
		
		var request = URLRequest(url: url)
		request.httpMethod = "POST"
		request.setValue("application/json", forHTTPHeaderField: "Content-Type")
		
		let body: [String: Any] = [
			"access_token": accessToken
		]
		
		request.httpBody = try JSONSerialization.data(withJSONObject: body)
		
		let (data, response) = try await URLSession.shared.data(for: request)
		
		guard let httpResponse = response as? HTTPURLResponse,
			  httpResponse.statusCode == 200 else {
			throw PlaidError.apiError("Failed to fetch account balance")
		}
		
		let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
		guard let accounts = json?["accounts"] as? [[String: Any]] else {
			throw PlaidError.apiError("Invalid response format")
		}
		
		if let accountData = accounts.first(where: { ($0["account_id"] as? String) == account.plaidAccountId }),
		   let balances = accountData["balances"] as? [String: Any],
		   let available = balances["available"] as? Double {
			return available
		}
		
		throw PlaidError.accountNotFound
	}
	
	private func fetchAccountInfo(
		accessToken: String,
		institutionName: String,
		accounts: [PlaidAccountMetadata]
	) async throws -> LinkedAccount {
		guard let url = URL(string: "\(backendBaseURL)/plaid/accounts") else {
			throw PlaidError.invalidURL
		}
		
		var request = URLRequest(url: url)
		request.httpMethod = "POST"
		request.setValue("application/json", forHTTPHeaderField: "Content-Type")
		
		let body: [String: Any] = [
			"access_token": accessToken
		]
		
		request.httpBody = try JSONSerialization.data(withJSONObject: body)
		
		let (data, response) = try await URLSession.shared.data(for: request)
		
		guard let httpResponse = response as? HTTPURLResponse,
			  httpResponse.statusCode == 200 else {
			throw PlaidError.apiError("Failed to fetch account info")
		}
		
		let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
		guard let accountsData = json?["accounts"] as? [[String: Any]],
			  let firstAccount = accountsData.first else {
			throw PlaidError.apiError("No accounts found")
		}
		
		let accountName = firstAccount["name"] as? String ?? "Account"
		let accountId = firstAccount["account_id"] as? String ?? UUID().uuidString
		let mask = firstAccount["mask"] as? String ?? "****"
		let balances = firstAccount["balances"] as? [String: Any]
		let balance = balances?["available"] as? Double ?? 0
		
		let accountType: Account.AccountType
		if let type = firstAccount["type"] as? String {
			switch type.lowercased() {
			case "depository":
				accountType = .checking
			case "credit":
				accountType = .credit
			default:
				accountType = .other
			}
		} else {
			accountType = .checking
		}
		
		let linkedAccount = LinkedAccount(
			id: UUID().uuidString,
			institutionName: institutionName,
			accountName: accountName,
			accountType: accountType,
			accountNumber: mask,
			balance: balance,
			isLinked: true,
			lastSynced: Date(),
			plaidAccessToken: accessToken,
			plaidAccountId: accountId
		)
		
		saveAccessToken(accessToken, for: linkedAccount.id)
		return linkedAccount
	}
	
	private func saveAccessToken(_ token: String, for accountId: String) {
		UserDefaults.standard.set(token, forKey: "plaid_access_token_\(accountId)")
	}
	
	private func getAccessToken(for accountId: String) -> String? {
		return UserDefaults.standard.string(forKey: "plaid_access_token_\(accountId)")
	}
	
	func unlinkAccount(_ account: LinkedAccount) async throws {
		if let accessToken = getAccessToken(for: account.id) {
			guard let url = URL(string: "\(backendBaseURL)/plaid/revoke-token") else {
				throw PlaidError.invalidURL
			}
			
			var request = URLRequest(url: url)
			request.httpMethod = "POST"
			request.setValue("application/json", forHTTPHeaderField: "Content-Type")
			
			let body: [String: Any] = [
				"access_token": accessToken
			]
			
			request.httpBody = try JSONSerialization.data(withJSONObject: body)
			
			let (_, response) = try await URLSession.shared.data(for: request)
			
			guard let httpResponse = response as? HTTPURLResponse,
				  httpResponse.statusCode == 200 else {
				throw PlaidError.apiError("Failed to revoke token")
			}
		}
		
		UserDefaults.standard.removeObject(forKey: "plaid_access_token_\(account.id)")
		linkedAccounts.removeAll { $0.id == account.id }
	}
}

// MARK: - Plaid Data Models

struct LinkedAccount: Identifiable, Codable {
	let id: String
	let institutionName: String
	let accountName: String
	let accountType: Account.AccountType
	let accountNumber: String
	var balance: Double
	var isLinked: Bool
	var lastSynced: Date?
	let plaidAccessToken: String?
	let plaidAccountId: String?
	
	init(
		id: String = UUID().uuidString,
		institutionName: String,
		accountName: String,
		accountType: Account.AccountType,
		accountNumber: String,
		balance: Double,
		isLinked: Bool,
		lastSynced: Date? = nil,
		plaidAccessToken: String? = nil,
		plaidAccountId: String? = nil
	) {
		self.id = id
		self.institutionName = institutionName
		self.accountName = accountName
		self.accountType = accountType
		self.accountNumber = accountNumber
		self.balance = balance
		self.isLinked = isLinked
		self.lastSynced = lastSynced
		self.plaidAccessToken = plaidAccessToken
		self.plaidAccountId = plaidAccountId
	}
}

struct ImportedTransaction: Identifiable {
	let id: String
	let accountId: String
	let amount: Double
	let date: Date
	let description: String
	let category: String
	let merchant: String?
	let type: Transaction.TransactionType
}

struct PlaidAccountMetadata {
	let id: String
	let name: String
	let mask: String?
	let type: String?
	let subtype: String?
}

enum PlaidError: LocalizedError {
	case invalidURL
	case accountNotFound
	case apiError(String)
	case tokenExchangeFailed
	case linkTokenCreationFailed
	
	var errorDescription: String? {
		switch self {
		case .invalidURL:
			return "Invalid URL"
		case .accountNotFound:
			return "Account not found"
		case .apiError(let message):
			return "API Error: \(message)"
		case .tokenExchangeFailed:
			return "Failed to exchange token"
		case .linkTokenCreationFailed:
			return "Failed to create link token"
		}
	}
}

// MARK: - AIInsightsService (included here because AIInsightsService.swift is not in Xcode project target)

// AI-powered spending insights and predictions

class AIInsightsService: ObservableObject {
	static let shared = AIInsightsService()
	
	private init() {}
	
	// MARK: - Spending Predictions
	
	func predictMonthlySpending(transactions: [Transaction]) -> Double {
		let expenses = transactions.filter { $0.type == .expense }
		let calendar = Calendar.current
		
		// Get last 3 months of data
		let threeMonthsAgo = calendar.date(byAdding: .month, value: -3, to: Date()) ?? Date()
		let recentExpenses = expenses.filter { $0.date >= threeMonthsAgo }
		
		guard !recentExpenses.isEmpty else { return 0 }
		
		// Calculate average monthly spending
		let monthlyTotals = Dictionary(grouping: recentExpenses) { transaction in
			calendar.dateComponents([.year, .month], from: transaction.date)
		}
		.map { $0.value.reduce(0) { $0 + $1.amount } }
		
		return monthlyTotals.isEmpty ? 0 : monthlyTotals.reduce(0, +) / Double(monthlyTotals.count)
	}
	
	// MARK: - Anomaly Detection
	
	func detectAnomalies(transactions: [Transaction]) -> [SpendingAnomaly] {
		var anomalies: [SpendingAnomaly] = []
		let expenses = transactions.filter { $0.type == .expense }
		
		// Group by category
		let categorySpending = Dictionary(grouping: expenses) { $0.category }
			.mapValues { transactions in
				transactions.reduce(0) { $0 + $1.amount }
			}
		
		// Calculate average spending per category
		let avgSpending = categorySpending.values.reduce(0, +) / Double(categorySpending.count)
		
		// Detect unusual spending
		for (category, total) in categorySpending {
			if total > avgSpending * 2 {
				anomalies.append(SpendingAnomaly(
					type: .unusualSpending,
					category: category,
					amount: total,
					message: "Unusually high spending in \(category)"
				))
			}
		}
		
		// Detect large transactions
		let largeTransactions = expenses.filter { $0.amount > 500 }
		for transaction in largeTransactions {
			anomalies.append(SpendingAnomaly(
				type: .largeTransaction,
				category: transaction.category,
				amount: transaction.amount,
				message: "Large transaction: $\(String(format: "%.2f", transaction.amount))"
			))
		}
		
		return anomalies
	}
	
	// MARK: - Spending Trends
	
	func analyzeSpendingTrend(transactions: [Transaction], category: String? = nil) -> SpendingTrend {
		let expenses = transactions.filter { transaction in
			if let category = category {
				return transaction.type == .expense && transaction.category == category
			}
			return transaction.type == .expense
		}
		
		let calendar = Calendar.current
		let sixMonthsAgo = calendar.date(byAdding: .month, value: -6, to: Date()) ?? Date()
		let recentExpenses = expenses.filter { $0.date >= sixMonthsAgo }
		
		// Group by month
		let monthlySpendingDict = Dictionary(grouping: recentExpenses) { transaction in
			calendar.dateComponents([.year, .month], from: transaction.date)
		}
		.mapValues { transactions in
			transactions.reduce(0) { $0 + $1.amount }
		}
		let monthlySpending = Array(monthlySpendingDict).sorted { 
			guard let year0 = $0.key.year, let month0 = $0.key.month,
				  let year1 = $1.key.year, let month1 = $1.key.month else {
				return false
			}
			if year0 != year1 {
				return year0 < year1
			}
			return month0 < month1
		}
		
		guard monthlySpending.count >= 2 else {
			return SpendingTrend(direction: .stable, percentage: 0, message: "Insufficient data")
		}
		
		let amounts = monthlySpending.map { $1 }
		let firstHalf = amounts.prefix(amounts.count / 2).reduce(0, +) / Double(amounts.count / 2)
		let secondHalf = amounts.suffix(amounts.count / 2).reduce(0, +) / Double(amounts.count / 2)
		
		let change = ((secondHalf - firstHalf) / firstHalf) * 100
		
		let direction: SpendingTrend.TrendDirection = change > 5 ? .increasing : change < -5 ? .decreasing : .stable
		let message = direction == .increasing ? "Spending is increasing" :
					 direction == .decreasing ? "Spending is decreasing" :
					 "Spending is stable"
		
		return SpendingTrend(
			direction: direction,
			percentage: abs(change),
			message: message
		)
	}
	
	// MARK: - Smart Recommendations
	
	func generateRecommendations(
		transactions: [Transaction],
		budgets: [Budget],
		debts: [Debt]
	) -> [Recommendation] {
		var recommendations: [Recommendation] = []
		
		// Budget recommendations
		for budget in budgets {
			let percentage = (budget.spentAmount / budget.budgetedAmount) * 100
			if percentage > 90 {
				recommendations.append(Recommendation(
					type: .budgetWarning,
					title: "Budget Alert",
					message: "You've spent \(Int(percentage))% of your \(budget.category) budget",
					priority: .high
				))
			}
		}
		
		// Debt recommendations
		let totalDebt = debts.reduce(0) { $0 + $1.balance }
		if totalDebt > 0 {
			let highInterestDebts = debts.filter { $0.interestRate > 10 }
			if !highInterestDebts.isEmpty {
				recommendations.append(Recommendation(
					type: .debtPayoff,
					title: "High Interest Debt",
					message: "Consider paying off high-interest debt first",
					priority: .high
				))
			}
		}
		
		// Savings recommendations
		let income = transactions.filter { $0.type == .income }.reduce(0) { $0 + $1.amount }
		let expenses = transactions.filter { $0.type == .expense }.reduce(0) { $0 + $1.amount }
		let savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0
		
		if savingsRate < 20 {
			recommendations.append(Recommendation(
				type: .savings,
				title: "Low Savings Rate",
				message: "Try to save at least 20% of your income",
				priority: .medium
			))
		}
		
		return recommendations
	}
}

// MARK: - AI Insights Data Models

struct SpendingAnomaly: Identifiable {
	let id = UUID()
	let type: AnomalyType
	let category: String
	let amount: Double
	let message: String
	
	enum AnomalyType {
		case unusualSpending
		case largeTransaction
		case duplicateTransaction
	}
}

struct SpendingTrend {
	let direction: TrendDirection
	let percentage: Double
	let message: String
	
	enum TrendDirection {
		case increasing
		case decreasing
		case stable
	}
}

struct Recommendation: Identifiable {
	let id = UUID()
	let type: RecommendationType
	let title: String
	let message: String
	let priority: Priority
	
	enum RecommendationType {
		case budgetWarning
		case debtPayoff
		case savings
		case spending
	}
	
	enum Priority {
		case high
		case medium
		case low
	}
}

// MARK: - Investment Models (included here because Investment.swift is not in Xcode project target)

struct Investment: Identifiable, Codable {
	let id: String
	var accountName: String
	var accountType: InvestmentAccountType
	var holdings: [Holding]
	var createdAt: Date
	var lastUpdated: Date
	
	enum InvestmentAccountType: String, Codable, CaseIterable {
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
		holdings: [Holding] = [],
		createdAt: Date = Date(),
		lastUpdated: Date = Date()
	) {
		self.id = id
		self.accountName = accountName
		self.accountType = accountType
		self.holdings = holdings
		self.createdAt = createdAt
		self.lastUpdated = lastUpdated
	}
	
	var totalValue: Double {
		holdings.reduce(0) { $0 + ($1.quantity * $1.currentPrice) }
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
	
	enum HoldingType: String, Codable, CaseIterable {
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

