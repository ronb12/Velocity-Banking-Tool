//
//  DataService.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import Foundation
import CoreData

class DataService {
	let context: NSManagedObjectContext
	private let encoder = JSONEncoder()
	private let decoder = JSONDecoder()
	
	init(context: NSManagedObjectContext) {
		self.context = context
		encoder.dateEncodingStrategy = .iso8601
		decoder.dateDecodingStrategy = .iso8601
	}
	
	// MARK: - Transaction Methods
	
	func saveTransaction(_ transaction: Transaction) async throws {
		let entity = fetchTransactionEntity(by: transaction.id) ?? TransactionEntity(context: context)
		entity.id = transaction.id
		entity.amount = transaction.amount
		entity.category = transaction.category
		entity.date = transaction.date
		entity.transactionDescription = transaction.description
		entity.type = transaction.type.rawValue
		entity.budgetId = transaction.budgetId
		entity.accountId = transaction.accountId
		entity.createdAt = transaction.createdAt
		
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
		
		// Create activity log
		let activity = Activity(type: .transaction, description: "\(transaction.type.rawValue.capitalized): \(transaction.description)", amount: transaction.amount)
		try await saveActivity(activity)
		
		try context.save()
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
		if let entity = fetchBudgetEntity(by: budget.id) {
			context.delete(entity)
			try context.save()
		}
	}
	
	// MARK: - Debt Methods
	
	func saveDebt(_ debt: Debt) async throws {
		let entity = fetchDebtEntity(by: debt.id) ?? DebtEntity(context: context)
		entity.id = debt.id
		entity.name = debt.name
		entity.balance = debt.balance
		entity.interestRate = debt.interestRate
		entity.minimumPayment = debt.minimumPayment
		entity.dueDate = debt.dueDate
		entity.createdAt = debt.createdAt
		
		// Create activity log
		let activity = Activity(type: .debtCreated, description: "Debt created: \(debt.name)", amount: debt.balance)
		try await saveActivity(activity)
		
		try context.save()
	}
	
	func fetchDebts() async throws -> [Debt] {
		let request = NSFetchRequest<DebtEntity>(entityName: "DebtEntity")
		request.sortDescriptors = [NSSortDescriptor(keyPath: \DebtEntity.createdAt, ascending: false)]
		let entities = try context.fetch(request)
		
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
		if let entity = fetchDebtEntity(by: debt.id) {
			context.delete(entity)
			try context.save()
		}
	}
	
	// MARK: - Debt Payment Methods
	
	func saveDebtPayment(_ payment: DebtPayment) async throws {
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
		let entity = fetchSavingsGoalEntity(by: goal.id) ?? SavingsGoalEntity(context: context)
		entity.id = goal.id
		entity.name = goal.name
		entity.targetAmount = goal.targetAmount
		entity.currentAmount = goal.currentAmount
		entity.targetDate = goal.targetDate
		entity.priority = Int32(goal.priority)
		entity.createdAt = goal.createdAt
		
		// Create activity log
		let activity = Activity(type: .goalCreated, description: "Goal created: \(goal.name)", amount: goal.targetAmount)
		try await saveActivity(activity)
		
		try context.save()
	}
	
	func fetchSavingsGoals() async throws -> [SavingsGoal] {
		let request = NSFetchRequest<SavingsGoalEntity>(entityName: "SavingsGoalEntity")
		request.sortDescriptors = [NSSortDescriptor(keyPath: \SavingsGoalEntity.priority, ascending: true), NSSortDescriptor(keyPath: \SavingsGoalEntity.createdAt, ascending: false)]
		let entities = try context.fetch(request)
		
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
		if let entity = fetchSavingsGoalEntity(by: goal.id) {
			context.delete(entity)
			try context.save()
		}
	}
	
	// MARK: - Savings Contribution Methods
	
	func saveSavingsContribution(_ contribution: SavingsContribution) async throws {
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
}

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           