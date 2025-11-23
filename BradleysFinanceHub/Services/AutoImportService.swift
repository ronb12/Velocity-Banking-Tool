//
//  AutoImportService.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-16.
//

import Foundation

struct BankAccount: Identifiable, Codable {
    var id: String
    var name: String
    var institution: String
    var accountType: AccountType
    var lastSyncDate: Date?
    var isConnected: Bool
    var plaidItemId: String? // For Plaid integration
    var accessToken: String? // Securely stored access token
    
    enum AccountType: String, Codable {
        case checking = "checking"
        case savings = "savings"
        case credit = "credit"
        case investment = "investment"
    }
    
    init(id: String = UUID().uuidString, name: String, institution: String, accountType: AccountType, lastSyncDate: Date? = nil, isConnected: Bool = false, plaidItemId: String? = nil, accessToken: String? = nil) {
        self.id = id
        self.name = name
        self.institution = institution
        self.accountType = accountType
        self.lastSyncDate = lastSyncDate
        self.isConnected = isConnected
        self.plaidItemId = plaidItemId
        self.accessToken = accessToken
    }
}

struct ImportedTransaction: Identifiable {
    var id: String
    var amount: Double
    var date: Date
    var description: String
    var merchant: String?
    var category: String?
    var accountId: String
    var pending: Bool
    var transactionId: String? // Bank's transaction ID
}

class AutoImportService: ObservableObject {
    static var shared: AutoImportService {
        // Create a temporary DataService for the shared instance
        let stack = CoreDataStack(useCloudKit: false)
        let tempService = DataService(context: stack.viewContext)
        return AutoImportService(dataService: tempService)
    }
    
    @Published var connectedAccounts: [BankAccount] = []
    @Published var isImporting = false
    @Published var lastImportDate: Date?
    
    private var dataService: DataService?
    
    init(dataService: DataService? = nil) {
        self.dataService = dataService
    }
    
    func updateDataService(_ newService: DataService) {
        self.dataService = newService
    }
    
    // MARK: - Bank Account Linking
    
    /// Connect a bank account (placeholder for Plaid integration)
    func connectBankAccount(name: String, institution: String, accountType: BankAccount.AccountType) async throws -> BankAccount {
        // TODO: Integrate with Plaid Link
        // This is a placeholder that simulates account connection
        let account = BankAccount(
            name: name,
            institution: institution,
            accountType: accountType,
            isConnected: true
        )
        
        connectedAccounts.append(account)
        return account
    }
    
    /// Disconnect a bank account
    func disconnectBankAccount(_ account: BankAccount) async throws {
        // TODO: Revoke Plaid access token
        connectedAccounts.removeAll { $0.id == account.id }
    }
    
    // MARK: - Transaction Import
    
    /// Import transactions from all connected accounts
    func importTransactions(from startDate: Date? = nil, to endDate: Date? = nil) async throws -> [ImportedTransaction] {
        isImporting = true
        defer { isImporting = false }
        
        var allTransactions: [ImportedTransaction] = []
        
        for account in connectedAccounts where account.isConnected {
            do {
                let transactions = try await fetchTransactions(
                    for: account,
                    from: startDate,
                    to: endDate
                )
                allTransactions.append(contentsOf: transactions)
            } catch {
                print("Error importing transactions for \(account.name): \(error)")
            }
        }
        
        lastImportDate = Date()
        return allTransactions
    }
    
    /// Fetch transactions for a specific account (placeholder for Plaid API)
    private func fetchTransactions(for account: BankAccount, from startDate: Date?, to endDate: Date?) async throws -> [ImportedTransaction] {
        // TODO: Implement Plaid API call
        // This is a placeholder that returns empty array
        // In production, this would call Plaid's /transactions/get endpoint
        
        /*
         Example Plaid integration:
         
         let request = TransactionsGetRequest(
             access_token: account.accessToken,
             start_date: startDate ?? Date().addingTimeInterval(-30 * 24 * 60 * 60),
             end_date: endDate ?? Date()
         )
         
         let response = try await plaidClient.transactionsGet(request)
         
         return response.transactions.map { plaidTransaction in
             ImportedTransaction(
                 id: UUID().uuidString,
                 amount: plaidTransaction.amount,
                 date: plaidTransaction.date,
                 description: plaidTransaction.name,
                 merchant: plaidTransaction.merchant_name,
                 category: plaidTransaction.category?.first,
                 accountId: account.id,
                 pending: plaidTransaction.pending,
                 transactionId: plaidTransaction.transaction_id
             )
         }
         */
        
        return []
    }
    
    // MARK: - Transaction Processing
    
    /// Process imported transactions and save to app
    func processImportedTransactions(_ transactions: [ImportedTransaction], autoCategorize: Bool = true) async throws {
        guard let dataService = dataService else {
            throw NSError(domain: "AutoImportService", code: 1, userInfo: [NSLocalizedDescriptionKey: "DataService is not available"])
        }
        
        for imported in transactions {
            // Check if transaction already exists
            let existingTransactions = try await dataService.fetchTransactions()
            if existingTransactions.contains(where: { $0.description == imported.description && $0.amount == imported.amount && Calendar.current.isDate($0.date, inSameDayAs: imported.date) }) {
                continue // Skip duplicates
            }
            
            // Auto-categorize if enabled
            var category = imported.category ?? "Other"
            if autoCategorize && imported.category == nil {
                category = categorizeTransaction(imported)
            }
            
            // Create transaction
            let transaction = Transaction(
                amount: abs(imported.amount), // Make positive for expenses
                category: category,
                date: imported.date,
                description: imported.description,
                type: imported.amount < 0 ? .expense : .income,
                accountId: imported.accountId
            )
            
            try await dataService.saveTransaction(transaction)
        }
    }
    
    /// Auto-categorize transaction based on description/merchant
    private func categorizeTransaction(_ transaction: ImportedTransaction) -> String {
        let description = (transaction.description + " " + (transaction.merchant ?? "")).lowercased()
        
        // Simple keyword-based categorization
        // In production, this could use ML or more sophisticated matching
        
        if description.contains("grocery") || description.contains("supermarket") || description.contains("walmart") || description.contains("target") {
            return "Food & Dining"
        } else if description.contains("gas") || description.contains("fuel") || description.contains("shell") || description.contains("chevron") {
            return "Transportation"
        } else if description.contains("restaurant") || description.contains("cafe") || description.contains("mcdonald") || description.contains("starbucks") {
            return "Food & Dining"
        } else if description.contains("electric") || description.contains("utility") || description.contains("water") || description.contains("internet") || description.contains("phone") {
            return "Bills & Utilities"
        } else if description.contains("rent") || description.contains("mortgage") {
            return "Housing"
        } else if description.contains("insurance") {
            return "Insurance"
        } else if description.contains("medical") || description.contains("pharmacy") || description.contains("doctor") {
            return "Healthcare"
        } else if description.contains("salary") || description.contains("payroll") || description.contains("deposit") {
            return "Salary"
        } else {
            return "Other"
        }
    }
    
    // MARK: - Sync Management
    
    /// Sync all accounts (called periodically or manually)
    func syncAllAccounts() async throws {
        let thirtyDaysAgo = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        let transactions = try await importTransactions(from: thirtyDaysAgo)
        try await processImportedTransactions(transactions, autoCategorize: true)
    }
    
    /// Get sync status for all accounts
    func getSyncStatus() -> [String: Date?] {
        var status: [String: Date?] = [:]
        for account in connectedAccounts {
            status[account.id] = account.lastSyncDate
        }
        return status
    }
}

