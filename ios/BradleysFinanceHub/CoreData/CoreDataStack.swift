//
//  CoreDataStack.swift
//  BradleysFinanceHub
//
//  Provides Core Data stack with optional CloudKit sync.
//

import Foundation
import CoreData

final class CoreDataStack {
	static let modelName = "BradleysFinanceHubModel"
	
	let container: NSPersistentContainer
	var viewContext: NSManagedObjectContext { container.viewContext }
	
	init(useCloudKit: Bool = false) {
		// Build model programmatically to avoid requiring an .xcdatamodeld file.
		let model = CoreDataStack.buildModel()
		
		if useCloudKit {
			#if canImport(CoreData)
			if #available(iOS 13.0, *) {
				// Try CloudKit container, but fallback to local if it fails
				let cloudContainer = NSPersistentCloudKitContainer(name: CoreDataStack.modelName, managedObjectModel: model)
				
				let storeURL = CoreDataStack.defaultStoreURL()
				let description = NSPersistentStoreDescription(url: storeURL)
				description.setOption(true as NSNumber, forKey: NSPersistentHistoryTrackingKey)
				description.setOption(true as NSNumber, forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)
				
				// Enable CloudKit - use dynamic bundle identifier
				let bundleID = Bundle.main.bundleIdentifier ?? "com.bradleysfinancehub.app"
				let containerIdentifier = "iCloud.\(bundleID)"
				description.cloudKitContainerOptions = NSPersistentCloudKitContainerOptions(containerIdentifier: containerIdentifier)
				print("📦 CloudKit container: \(containerIdentifier)")
				
				cloudContainer.persistentStoreDescriptions = [description]
				container = cloudContainer
			} else {
				container = NSPersistentContainer(name: CoreDataStack.modelName, managedObjectModel: model)
			}
			#else
			container = NSPersistentContainer(name: CoreDataStack.modelName, managedObjectModel: model)
			#endif
		} else {
			container = NSPersistentContainer(name: CoreDataStack.modelName, managedObjectModel: model)
		}
		
		container.loadPersistentStores { description, error in
			if let error = error {
				// Log error instead of crashing
				print("Core Data error: \(error.localizedDescription)")
				print("Store description: \(description)")
				
				// Try to recover by deleting and recreating the store
				if let url = description.url {
					do {
						try FileManager.default.removeItem(at: url)
						print("Deleted corrupted store, will recreate on next launch")
					} catch {
						print("Failed to delete store: \(error.localizedDescription)")
					}
				}
			} else {
				print("Core Data store loaded successfully")
			}
		}
		
		// Ensure view context is configured properly
		container.viewContext.automaticallyMergesChangesFromParent = true
		container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
		
		container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
		container.viewContext.automaticallyMergesChangesFromParent = true
	}
	
	private static func defaultStoreURL() -> URL {
		let storeName = "\(modelName).sqlite"
		// Try documents directory first
		if let storeURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
			return storeURL.appendingPathComponent(storeName)
		}
		// Fallback to caches directory if documents directory is unavailable
		if let cacheURL = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first {
			return cacheURL.appendingPathComponent(storeName)
		}
		// Last resort: use temporary directory
		return FileManager.default.temporaryDirectory.appendingPathComponent(storeName)
	}
}

// MARK: - Programmatic Model

private extension CoreDataStack {
	static func buildModel() -> NSManagedObjectModel {
		let model = NSManagedObjectModel()
		
		// Common attributes
		func stringAttr(optional: Bool = true) -> NSAttributeDescription {
			let a = NSAttributeDescription()
			a.attributeType = .stringAttributeType
			a.isOptional = optional
			return a
		}
		func doubleAttr() -> NSAttributeDescription {
			let a = NSAttributeDescription()
			a.attributeType = .doubleAttributeType
			a.isOptional = false
			return a
		}
		func dateAttr(optional: Bool = true) -> NSAttributeDescription {
			let a = NSAttributeDescription()
			a.attributeType = .dateAttributeType
			a.isOptional = optional
			return a
		}
		
		// UserEntity
		let userEntity = NSEntityDescription()
		userEntity.name = "UserEntity"
		userEntity.managedObjectClassName = NSStringFromClass(UserEntity.self)
		let user_id = stringAttr(optional: false); user_id.name = "id"
		let user_email = stringAttr(optional: false); user_email.name = "email"
		let user_displayName = stringAttr(); user_displayName.name = "displayName"
		let user_createdAt = dateAttr(optional: false); user_createdAt.name = "createdAt"
		userEntity.properties = [user_id, user_email, user_displayName, user_createdAt]
		
		// DebtEntity
		let debtEntity = NSEntityDescription()
		debtEntity.name = "DebtEntity"
		debtEntity.managedObjectClassName = NSStringFromClass(DebtEntity.self)
		let debt_id = stringAttr(optional: false); debt_id.name = "id"
		let debt_name = stringAttr(optional: false); debt_name.name = "name"
		let debt_balance = doubleAttr(); debt_balance.name = "balance"
		let debt_interestRate = doubleAttr(); debt_interestRate.name = "interestRate"
		let debt_minimumPayment = doubleAttr(); debt_minimumPayment.name = "minimumPayment"
		let debt_dueDate = dateAttr(); debt_dueDate.name = "dueDate"
		let debt_createdAt = dateAttr(optional: false); debt_createdAt.name = "createdAt"
		debtEntity.properties = [debt_id, debt_name, debt_balance, debt_interestRate, debt_minimumPayment, debt_dueDate, debt_createdAt]
		
		// BudgetEntity
		let budgetEntity = NSEntityDescription()
		budgetEntity.name = "BudgetEntity"
		budgetEntity.managedObjectClassName = NSStringFromClass(BudgetEntity.self)
		let budget_id = stringAttr(optional: false); budget_id.name = "id"
		let budget_category = stringAttr(optional: false); budget_category.name = "category"
		let budget_budgeted = doubleAttr(); budget_budgeted.name = "budgetedAmount"
		let budget_spent = doubleAttr(); budget_spent.name = "spentAmount"
		let budget_month = dateAttr(optional: false); budget_month.name = "month"
		let budget_alertThresholds = stringAttr(); budget_alertThresholds.name = "alertThresholds"
		let budget_createdAt = dateAttr(optional: false); budget_createdAt.name = "createdAt"
		budgetEntity.properties = [budget_id, budget_category, budget_budgeted, budget_spent, budget_month, budget_alertThresholds, budget_createdAt]
		
		// SavingsGoalEntity
		let goalEntity = NSEntityDescription()
		goalEntity.name = "SavingsGoalEntity"
		goalEntity.managedObjectClassName = NSStringFromClass(SavingsGoalEntity.self)
		let goal_id = stringAttr(optional: false); goal_id.name = "id"
		let goal_name = stringAttr(optional: false); goal_name.name = "name"
		let goal_target = doubleAttr(); goal_target.name = "targetAmount"
		let goal_current = doubleAttr(); goal_current.name = "currentAmount"
		let goal_targetDate = dateAttr(); goal_targetDate.name = "targetDate"
		let goal_priority = NSAttributeDescription(); goal_priority.attributeType = .integer32AttributeType; goal_priority.isOptional = false; goal_priority.name = "priority"
		let goal_createdAt = dateAttr(optional: false); goal_createdAt.name = "createdAt"
		goalEntity.properties = [goal_id, goal_name, goal_target, goal_current, goal_targetDate, goal_priority, goal_createdAt]
		
		// NetWorthEntity
		let netWorthEntity = NSEntityDescription()
		netWorthEntity.name = "NetWorthEntity"
		netWorthEntity.managedObjectClassName = NSStringFromClass(NetWorthEntity.self)
		let nw_id = stringAttr(optional: false); nw_id.name = "id"
		let nw_date = dateAttr(optional: false); nw_date.name = "date"
		let nw_assets = doubleAttr(); nw_assets.name = "assets"
		let nw_liabilities = doubleAttr(); nw_liabilities.name = "liabilities"
		netWorthEntity.properties = [nw_id, nw_date, nw_assets, nw_liabilities]
		
		// ActivityEntity
		let activityEntity = NSEntityDescription()
		activityEntity.name = "ActivityEntity"
		activityEntity.managedObjectClassName = NSStringFromClass(ActivityEntity.self)
		let act_id = stringAttr(optional: false); act_id.name = "id"
		let act_type = stringAttr(optional: false); act_type.name = "type"
		let act_description = stringAttr(optional: false); act_description.name = "activityDescription"
		let act_amount = doubleAttr(); act_amount.name = "amount"
		let act_date = dateAttr(optional: false); act_date.name = "date"
		activityEntity.properties = [act_id, act_type, act_description, act_amount, act_date]
		
		// TransactionEntity
		let transactionEntity = NSEntityDescription()
		transactionEntity.name = "TransactionEntity"
		transactionEntity.managedObjectClassName = NSStringFromClass(TransactionEntity.self)
		let trans_id = stringAttr(optional: false); trans_id.name = "id"
		let trans_amount = doubleAttr(); trans_amount.name = "amount"
		let trans_category = stringAttr(optional: false); trans_category.name = "category"
		let trans_date = dateAttr(optional: false); trans_date.name = "date"
		let trans_description = stringAttr(optional: false); trans_description.name = "transactionDescription"
		let trans_type = stringAttr(optional: false); trans_type.name = "type"
		let trans_budgetId = stringAttr(); trans_budgetId.name = "budgetId"
		let trans_accountId = stringAttr(); trans_accountId.name = "accountId"
		let trans_tags = stringAttr(); trans_tags.name = "tags"
		let trans_splitTransactions = stringAttr(); trans_splitTransactions.name = "splitTransactions"
		let trans_createdAt = dateAttr(optional: false); trans_createdAt.name = "createdAt"
		transactionEntity.properties = [trans_id, trans_amount, trans_category, trans_date, trans_description, trans_type, trans_budgetId, trans_accountId, trans_tags, trans_splitTransactions, trans_createdAt]
		
		// DebtPaymentEntity
		let paymentEntity = NSEntityDescription()
		paymentEntity.name = "DebtPaymentEntity"
		paymentEntity.managedObjectClassName = NSStringFromClass(DebtPaymentEntity.self)
		let pay_id = stringAttr(optional: false); pay_id.name = "id"
		let pay_debtId = stringAttr(optional: false); pay_debtId.name = "debtId"
		let pay_amount = doubleAttr(); pay_amount.name = "amount"
		let pay_date = dateAttr(optional: false); pay_date.name = "date"
		let pay_notes = stringAttr(); pay_notes.name = "notes"
		let pay_createdAt = dateAttr(optional: false); pay_createdAt.name = "createdAt"
		paymentEntity.properties = [pay_id, pay_debtId, pay_amount, pay_date, pay_notes, pay_createdAt]
		
		// SavingsContributionEntity
		let contributionEntity = NSEntityDescription()
		contributionEntity.name = "SavingsContributionEntity"
		contributionEntity.managedObjectClassName = NSStringFromClass(SavingsContributionEntity.self)
		let contrib_id = stringAttr(optional: false); contrib_id.name = "id"
		let contrib_goalId = stringAttr(optional: false); contrib_goalId.name = "goalId"
		let contrib_amount = doubleAttr(); contrib_amount.name = "amount"
		let contrib_date = dateAttr(optional: false); contrib_date.name = "date"
		let contrib_notes = stringAttr(); contrib_notes.name = "notes"
		let contrib_createdAt = dateAttr(optional: false); contrib_createdAt.name = "createdAt"
		contributionEntity.properties = [contrib_id, contrib_goalId, contrib_amount, contrib_date, contrib_notes, contrib_createdAt]
		
		// RecurringTransactionEntity
		let recurringEntity = NSEntityDescription()
		recurringEntity.name = "RecurringTransactionEntity"
		recurringEntity.managedObjectClassName = NSStringFromClass(RecurringTransactionEntity.self)
		let rec_id = stringAttr(optional: false); rec_id.name = "id"
		let rec_name = stringAttr(optional: false); rec_name.name = "name"
		let rec_amount = doubleAttr(); rec_amount.name = "amount"
		let rec_category = stringAttr(optional: false); rec_category.name = "category"
		let rec_type = stringAttr(optional: false); rec_type.name = "type"
		let rec_frequency = stringAttr(optional: false); rec_frequency.name = "frequency"
		let rec_startDate = dateAttr(optional: false); rec_startDate.name = "startDate"
		let rec_endDate = dateAttr(); rec_endDate.name = "endDate"
		let rec_nextDueDate = dateAttr(optional: false); rec_nextDueDate.name = "nextDueDate"
		let rec_accountId = stringAttr(); rec_accountId.name = "accountId"
		let rec_budgetId = stringAttr(); rec_budgetId.name = "budgetId"
		let rec_isActive = NSAttributeDescription(); rec_isActive.attributeType = .booleanAttributeType; rec_isActive.isOptional = false; rec_isActive.name = "isActive"
		let rec_createdAt = dateAttr(optional: false); rec_createdAt.name = "createdAt"
		recurringEntity.properties = [rec_id, rec_name, rec_amount, rec_category, rec_type, rec_frequency, rec_startDate, rec_endDate, rec_nextDueDate, rec_accountId, rec_budgetId, rec_isActive, rec_createdAt]
		
		// AccountEntity
		let accountEntity = NSEntityDescription()
		accountEntity.name = "AccountEntity"
		accountEntity.managedObjectClassName = NSStringFromClass(AccountEntity.self)
		let acc_id = stringAttr(optional: false); acc_id.name = "id"
		let acc_name = stringAttr(optional: false); acc_name.name = "name"
		let acc_type = stringAttr(optional: false); acc_type.name = "type"
		let acc_balance = doubleAttr(); acc_balance.name = "balance"
		let acc_institution = stringAttr(); acc_institution.name = "institution"
		let acc_accountNumber = stringAttr(); acc_accountNumber.name = "accountNumber"
		let acc_isActive = NSAttributeDescription(); acc_isActive.attributeType = .booleanAttributeType; acc_isActive.isOptional = false; acc_isActive.name = "isActive"
		let acc_createdAt = dateAttr(optional: false); acc_createdAt.name = "createdAt"
		accountEntity.properties = [acc_id, acc_name, acc_type, acc_balance, acc_institution, acc_accountNumber, acc_isActive, acc_createdAt]
		
		// ReceiptEntity
		let receiptEntity = NSEntityDescription()
		receiptEntity.name = "ReceiptEntity"
		receiptEntity.managedObjectClassName = NSStringFromClass(ReceiptEntity.self)
		let receipt_id = stringAttr(optional: false); receipt_id.name = "id"
		let receipt_transactionId = stringAttr(optional: false); receipt_transactionId.name = "transactionId"
		let receipt_imageData = NSAttributeDescription(); receipt_imageData.attributeType = .binaryDataAttributeType; receipt_imageData.isOptional = true; receipt_imageData.name = "imageData"
		let receipt_imageURL = stringAttr(); receipt_imageURL.name = "imageURL"
		let receipt_notes = stringAttr(); receipt_notes.name = "notes"
		let receipt_createdAt = dateAttr(optional: false); receipt_createdAt.name = "createdAt"
		receiptEntity.properties = [receipt_id, receipt_transactionId, receipt_imageData, receipt_imageURL, receipt_notes, receipt_createdAt]
		
		// FinancialHealthScoreEntity
		let healthEntity = NSEntityDescription()
		healthEntity.name = "FinancialHealthScoreEntity"
		healthEntity.managedObjectClassName = NSStringFromClass(FinancialHealthScoreEntity.self)
		let health_id = stringAttr(optional: false); health_id.name = "id"
		let health_score = NSAttributeDescription(); health_score.attributeType = .integer32AttributeType; health_score.isOptional = false; health_score.name = "score"
		let health_date = dateAttr(optional: false); health_date.name = "date"
		let health_debtToIncome = doubleAttr(); health_debtToIncome.name = "debtToIncomeRatio"
		let health_savingsRate = doubleAttr(); health_savingsRate.name = "savingsRate"
		let health_creditUtil = doubleAttr(); health_creditUtil.name = "creditUtilization"
		let health_emergencyFund = doubleAttr(); health_emergencyFund.name = "emergencyFundStatus"
		let health_budgetAdherence = doubleAttr(); health_budgetAdherence.name = "budgetAdherence"
		let health_recommendations = stringAttr(); health_recommendations.name = "recommendations"
		let health_createdAt = dateAttr(optional: false); health_createdAt.name = "createdAt"
		healthEntity.properties = [health_id, health_score, health_date, health_debtToIncome, health_savingsRate, health_creditUtil, health_emergencyFund, health_budgetAdherence, health_recommendations, health_createdAt]
		
		model.entities = [userEntity, debtEntity, budgetEntity, goalEntity, netWorthEntity, activityEntity, transactionEntity, paymentEntity, contributionEntity, recurringEntity, accountEntity, receiptEntity, healthEntity]
		return model
	}
}


