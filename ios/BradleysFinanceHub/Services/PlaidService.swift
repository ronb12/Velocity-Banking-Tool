//
//  PlaidService.swift
//  BradleysFinanceHub
//
//  Real Plaid SDK integration for bank account linking
//  Note: Add Plaid Link SDK via SPM: https://github.com/plaid/plaid-link-ios
//

import Foundation
import Combine
// import LinkKit  // Uncomment after adding Plaid SDK via SPM

class PlaidService: ObservableObject {
    static let shared = PlaidService()
    
    @Published var linkedAccounts: [LinkedAccount] = []
    @Published var isLinking: Bool = false
    @Published var errorMessage: String?
    
    // Plaid Configuration
    // Set these from environment variables or secure config
    private var plaidClientId: String {
        // In production, load from Keychain or environment
        return ProcessInfo.processInfo.environment["PLAID_CLIENT_ID"] ?? ""
    }
    
    private var plaidSecret: String {
        // In production, load from Keychain
        return ProcessInfo.processInfo.environment["PLAID_SECRET"] ?? ""
    }
    
    private var plaidEnvironment: PlaidEnvironment = .sandbox
    
    // Backend API base URL
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
        // Load from UserDefaults or Keychain
        if let env = UserDefaults.standard.string(forKey: "plaidEnvironment") {
            plaidEnvironment = PlaidEnvironment(rawValue: env) ?? .sandbox
        }
    }
    
    // MARK: - Link Bank Account (Real Plaid SDK)
    
    func linkBankAccount(presentingViewController: UIViewController, completion: @escaping (Result<LinkedAccount, Error>) -> Void) {
        isLinking = true
        errorMessage = nil
        
        // Step 1: Get Link token from backend
        Task {
            do {
                let linkToken = try await getLinkToken()
                
                // Step 2: Initialize Plaid Link with real SDK
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
        // Uncomment after adding Plaid SDK via SPM
        
        /*
        var linkConfiguration = LinkTokenConfiguration(
            token: linkToken,
            onSuccess: { [weak self] publicToken, metadata in
                guard let self = self else { return }
                
                // Step 3: Exchange public token for access token
                Task {
                    do {
                        let accessToken = try await self.exchangePublicToken(publicToken: publicToken)
                        
                        // Step 4: Fetch account information
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
        
        linkConfiguration.onEvent = { event in
            print("Plaid Link Event: \(event.eventName)")
        }
        
        linkConfiguration.onExit = { exitStatus in
            if exitStatus.error != nil {
                print("Plaid Link Error: \(exitStatus.error?.errorMessage ?? "Unknown")")
            }
        }
        
        // Present Plaid Link
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
        // Call your backend to create Link token
        guard let url = URL(string: "\(backendBaseURL)/plaid/create-link-token") else {
            throw PlaidError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authentication header if needed
        // request.setValue("Bearer \(userToken)", forHTTPHeaderField: "Authorization")
        
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
        // Call your backend to exchange public token
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
        
        // Store access token securely in Keychain
        saveAccessToken(accessToken, for: publicToken)
        
        return accessToken
    }
    
    // MARK: - Fetch Account Data
    
    func syncTransactions(for accountId: String) async throws -> [ImportedTransaction] {
        guard let account = linkedAccounts.first(where: { $0.id == accountId }),
              let accessToken = getAccessToken(for: accountId) else {
            throw PlaidError.accountNotFound
        }
        
        // Call backend to fetch transactions
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
        
        // Map Plaid transactions to app's transaction model
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
                amount: abs(amount), // Plaid uses negative for expenses
                date: date,
                description: name,
                category: category,
                merchant: merchant,
                type: amount < 0 ? .expense : .income
            )
        }
        
        // Update last synced time
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
        
        // Call backend to fetch account balance
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
        
        // Find matching account and return balance
        if let accountData = accounts.first(where: { ($0["account_id"] as? String) == account.plaidAccountId }),
           let balances = accountData["balances"] as? [String: Any],
           let available = balances["available"] as? Double {
            return available
        }
        
        throw PlaidError.accountNotFound
    }
    
    // MARK: - Helper Methods
    
    private func fetchAccountInfo(
        accessToken: String,
        institutionName: String,
        accounts: [PlaidAccountMetadata]
    ) async throws -> LinkedAccount {
        // Fetch account details from backend
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
        
        // Store access token
        saveAccessToken(accessToken, for: linkedAccount.id)
        
        return linkedAccount
    }
    
    // MARK: - Secure Token Storage
    
    private func saveAccessToken(_ token: String, for accountId: String) {
        // Store in Keychain (use KeychainSwift or similar)
        // For now, using UserDefaults (NOT SECURE - use Keychain in production)
        UserDefaults.standard.set(token, forKey: "plaid_access_token_\(accountId)")
    }
    
    private func getAccessToken(for accountId: String) -> String? {
        // Retrieve from Keychain
        return UserDefaults.standard.string(forKey: "plaid_access_token_\(accountId)")
    }
    
    // MARK: - Unlink Account
    
    func unlinkAccount(_ account: LinkedAccount) async throws {
        // Revoke access token via backend
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
        
        // Remove from local storage
        UserDefaults.standard.removeObject(forKey: "plaid_access_token_\(account.id)")
        linkedAccounts.removeAll { $0.id == account.id }
    }
}

// MARK: - Data Models

struct LinkedAccount: Identifiable, Codable {
    let id: String
    let institutionName: String
    let accountName: String
    let accountType: Account.AccountType
    let accountNumber: String // Masked
    var balance: Double
    var isLinked: Bool
    var lastSynced: Date?
    let plaidAccessToken: String? // Stored securely in production
    let plaidAccountId: String? // Plaid's account ID
    
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

// MARK: - Plaid Metadata (for SDK)

struct PlaidAccountMetadata {
    let id: String
    let name: String
    let mask: String?
    let type: String?
    let subtype: String?
}

// MARK: - Errors

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
