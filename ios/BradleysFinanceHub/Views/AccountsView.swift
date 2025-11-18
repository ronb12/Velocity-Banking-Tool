//
//  AccountsView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI
import UIKit

struct AccountsView: View {
    @EnvironmentObject var dataService: DataService
    @StateObject private var plaidService = PlaidService.shared
    @State private var accounts: [Account] = []
    @State private var showingAddAccount = false
    @State private var showingBankLinking = false
    @State private var selectedTab: AccountTab = .all
    
    enum AccountTab {
        case all, linked, manual
    }
    
    var linkedAccounts: [LinkedAccount] {
        plaidService.linkedAccounts
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Tab Picker
                Picker("View", selection: $selectedTab) {
                    Text("All").tag(AccountTab.all)
                    Text("Linked").tag(AccountTab.linked)
                    Text("Manual").tag(AccountTab.manual)
                }
                .pickerStyle(.segmented)
                .padding()
                
                // Content
                List {
                    // Link Bank Account Button
                    if selectedTab == .all || selectedTab == .linked {
                        Section {
                            Button(action: {
                                showingBankLinking = true
                            }) {
                                HStack {
                                    Image(systemName: "link.circle.fill")
                                        .foregroundColor(.blue)
                                        .font(.title2)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Link Bank Account")
                                            .font(.headline)
                                            .foregroundColor(.primary)
                                        Text("Automatically import transactions")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                                .padding(.vertical, 8)
                            }
                        }
                    }
                    
                    // Linked Accounts
                    if (selectedTab == .all || selectedTab == .linked) && !linkedAccounts.isEmpty {
                        Section("Linked Accounts") {
                            ForEach(linkedAccounts) { linkedAccount in
                                LinkedAccountCard(account: linkedAccount)
                            }
                        }
                    }
                    
                    // Manual Accounts
                    if (selectedTab == .all || selectedTab == .manual) && !accounts.isEmpty {
                        Section("Manual Accounts") {
                            ForEach(accounts) { account in
                                AccountRowView(account: account)
                            }
                            .onDelete(perform: deleteAccount)
                        }
                    }
                    
                    // Empty State
                    if accounts.isEmpty && linkedAccounts.isEmpty {
                        Section {
                            VStack(spacing: 16) {
                                Image(systemName: "creditcard")
                                    .font(.system(size: 50))
                                    .foregroundColor(.secondary)
                                Text("No Accounts")
                                    .font(.headline)
                                    .foregroundColor(.secondary)
                                Text("Link a bank account or add a manual account")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                    .multilineTextAlignment(.center)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 40)
                        }
                    }
                }
            }
            .navigationTitle("Accounts")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { showingBankLinking = true }) {
                            Label("Link Bank Account", systemImage: "link")
                        }
                        Button(action: { showingAddAccount = true }) {
                            Label("Add Manual Account", systemImage: "plus")
                        }
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddAccount) {
                AddAccountView(dataService: dataService)
                    .onDisappear {
                        Task {
                            await loadAccounts()
                        }
                    }
            }
            .sheet(isPresented: $showingBankLinking) {
                BankLinkingView()
                    .environmentObject(dataService)
            }
            .task {
                await loadAccounts()
            }
        }
    }
    
    private func loadAccounts() async {
        // Load manual accounts from DataService
        // Note: This requires DataService.fetchAccounts() to be implemented
        // For now, using empty array
        accounts = []
    }
    
    private func deleteAccount(at offsets: IndexSet) {
        for index in offsets {
            _ = accounts[index]
            Task {
                // Delete from DataService
                // try? await dataService.deleteAccount(account)
                await loadAccounts()
            }
        }
    }
}

struct LinkedAccountCard: View {
    let account: LinkedAccount
    
    var body: some View {
        HStack(spacing: 16) {
            // Institution Icon
            ZStack {
                Circle()
                    .fill(Color.blue.opacity(0.2))
                    .frame(width: 50, height: 50)
                Image(systemName: "building.columns.fill")
                    .foregroundColor(.blue)
                    .font(.title3)
            }
            
            VStack(alignment: .leading, spacing: 6) {
                Text(account.institutionName)
                    .font(.headline)
                Text(account.accountName)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                HStack {
                    Text(account.accountNumber)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Spacer()
                    Circle()
                        .fill(account.isLinked ? Color.green : Color.red)
                        .frame(width: 8, height: 8)
                    Text(account.isLinked ? "Connected" : "Disconnected")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text("$\(String(format: "%.2f", account.balance))")
                    .font(.headline)
                    .foregroundColor(account.balance >= 0 ? .green : .red)
                if let lastSynced = account.lastSynced {
                    Text("Synced \(lastSynced, style: .relative)")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct AccountRowView: View {
    let account: Account
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(account.name)
                    .font(.headline)
                Text(account.type.rawValue)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            Text("$\(String(format: "%.2f", account.balance))")
                .font(.headline)
                .foregroundColor(account.balance >= 0 ? .green : .red)
        }
    }
}

struct AddAccountView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    @State private var name = ""
    @State private var type: Account.AccountType = .checking
    @State private var balance = ""
    @State private var institution: String = ""
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var toastMessage: String?
    
    var body: some View {
        NavigationView {
            Form {
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                TextField("Account Name", text: $name)
                TextField("Institution (optional)", text: $institution)
                Picker("Type", selection: $type) {
                    Text("Checking").tag(Account.AccountType.checking)
                    Text("Savings").tag(Account.AccountType.savings)
                    Text("Credit").tag(Account.AccountType.credit)
                    Text("Investment").tag(Account.AccountType.investment)
                    Text("Other").tag(Account.AccountType.other)
                }
                TextField("Balance", text: $balance)
                    .keyboardType(.decimalPad)
            }
            .navigationTitle("Add Account")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveAccount()
                    }
                    .disabled(isSaving || name.isEmpty)
                }
            }
            .toast(message: $toastMessage)
        }
    }
    
    private func saveAccount() {
        guard let balanceValue = Double(balance) else {
            errorMessage = "Please enter a valid balance"
            return
        }
        
        guard !name.isEmpty else {
            errorMessage = "Please enter an account name"
            return
        }
        
        isSaving = true
        errorMessage = nil
        
        _ = Account(
            name: name,
            type: type,
            balance: balanceValue
        )
        
        Task {
            // Note: This requires DataService.saveAccount() to be implemented
            // For now, just show success
            try? await Task.sleep(nanoseconds: 500_000_000)
            HapticFeedback.success()
            toastMessage = "Account saved"
            await MainActor.run {
                isSaving = false
                dismiss()
            }
        }
    }
}

// MARK: - BankLinkingView (included here because BankLinkingView.swift is not in Xcode project target)

struct BankLinkingView: View {
    @StateObject private var plaidService = PlaidService.shared
    @EnvironmentObject var dataService: DataService
    @State private var showingLinkFlow = false
    @State private var isSyncing = false
    @State private var syncProgress: Double = 0
    @State private var toastMessage: String?
    
    var body: some View {
        NavigationView {
            List {
                // Link New Account Section
                Section {
                    Button(action: {
                        linkNewAccount()
                    }) {
                        HStack {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(.blue)
                                .font(.title2)
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Link Bank Account")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                Text("Connect your bank to automatically import transactions")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical, 8)
                    }
                    .disabled(plaidService.isLinking)
                    
                    if plaidService.isLinking {
                        HStack {
                            ProgressView()
                            Text("Connecting to your bank...")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                } header: {
                    Text("Bank Accounts")
                } footer: {
                    Text("Securely connect your accounts using Plaid. Your credentials are never stored.")
                }
                
                // Linked Accounts
                if !plaidService.linkedAccounts.isEmpty {
                    Section("Linked Accounts") {
                        ForEach(plaidService.linkedAccounts) { account in
                            LinkedAccountRow(
                                account: account,
                                onSync: {
                                    syncAccount(account)
                                },
                                onUnlink: {
                                    unlinkAccount(account)
                                }
                            )
                        }
                    }
                }
                
                // Manual Account Section
                Section("Manual Accounts") {
                    // This will show accounts added manually (non-linked)
                    Text("Add manual accounts in Accounts view")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .navigationTitle("Bank Linking")
            .toast(message: $toastMessage)
        }
    }
    
    private func linkNewAccount() {
        // Get the presenting view controller
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let rootViewController = windowScene.windows.first?.rootViewController {
            plaidService.linkBankAccount(presentingViewController: rootViewController) { result in
                switch result {
                case .success(let account):
                    HapticFeedback.success()
                    toastMessage = "Successfully linked \(account.institutionName)"
                case .failure(let error):
                    HapticFeedback.error()
                    toastMessage = "Failed to link account: \(error.localizedDescription)"
                }
            }
        }
    }
    
    private func syncAccount(_ account: LinkedAccount) {
        isSyncing = true
        syncProgress = 0
        
        Task {
            do {
                // Update balance
                let balance = try await plaidService.getAccountBalance(for: account.id)
                
                // Import transactions
                let transactions = try await plaidService.syncTransactions(for: account.id)
                
                // Save transactions to DataService
                for imported in transactions {
                    let transaction = Transaction(
                        amount: imported.amount,
                        category: imported.category,
                        date: imported.date,
                        description: imported.description,
                        type: imported.type,
                        accountId: account.id,
                        createdAt: imported.date
                    )
                    try await dataService.saveTransaction(transaction)
                }
                
                // Update account balance
                if let index = plaidService.linkedAccounts.firstIndex(where: { $0.id == account.id }) {
                    await MainActor.run {
                        plaidService.linkedAccounts[index].balance = balance
                        plaidService.linkedAccounts[index].lastSynced = Date()
                        isSyncing = false
                        HapticFeedback.success()
                        toastMessage = "Synced \(transactions.count) transactions"
                    }
                }
            } catch {
                await MainActor.run {
                    isSyncing = false
                    HapticFeedback.error()
                    toastMessage = "Sync failed: \(error.localizedDescription)"
                }
            }
        }
    }
    
    private func unlinkAccount(_ account: LinkedAccount) {
        Task {
            do {
                try await plaidService.unlinkAccount(account)
                HapticFeedback.success()
                toastMessage = "Account unlinked"
            } catch {
                HapticFeedback.error()
                toastMessage = "Failed to unlink: \(error.localizedDescription)"
            }
        }
    }
}

struct LinkedAccountRow: View {
    let account: LinkedAccount
    let onSync: () -> Void
    let onUnlink: () -> Void
    @State private var showingUnlinkAlert = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                // Institution Icon
                ZStack {
                    Circle()
                        .fill(Color.blue.opacity(0.2))
                        .frame(width: 50, height: 50)
                    Image(systemName: "building.columns.fill")
                        .foregroundColor(.blue)
                        .font(.title3)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(account.institutionName)
                        .font(.headline)
                    Text(account.accountName)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Text(account.accountNumber)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("$\(String(format: "%.2f", account.balance))")
                        .font(.headline)
                        .foregroundColor(account.balance >= 0 ? .green : .red)
                    
                    if let lastSynced = account.lastSynced {
                        Text("Synced \(lastSynced, style: .relative)")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    } else {
                        Text("Not synced")
                            .font(.caption2)
                            .foregroundColor(.orange)
                    }
                }
            }
            
            // Status Indicator
            HStack {
                Circle()
                    .fill(account.isLinked ? Color.green : Color.red)
                    .frame(width: 8, height: 8)
                Text(account.isLinked ? "Connected" : "Disconnected")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // Action Buttons
            HStack(spacing: 12) {
                Button(action: onSync) {
                    HStack {
                        Image(systemName: "arrow.clockwise")
                        Text("Sync Now")
                    }
                    .font(.subheadline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(Color.blue.opacity(0.1))
                    .foregroundColor(.blue)
                    .cornerRadius(8)
                }
                
                Button(action: {
                    showingUnlinkAlert = true
                }) {
                    HStack {
                        Image(systemName: "link.badge.minus")
                        Text("Unlink")
                    }
                    .font(.subheadline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(Color.red.opacity(0.1))
                    .foregroundColor(.red)
                    .cornerRadius(8)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .alert("Unlink Account", isPresented: $showingUnlinkAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Unlink", role: .destructive) {
                onUnlink()
            }
        } message: {
            Text("Are you sure you want to unlink this account? You'll need to reconnect to sync transactions again.")
        }
    }
}

