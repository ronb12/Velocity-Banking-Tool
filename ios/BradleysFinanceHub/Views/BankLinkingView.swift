//
//  BankLinkingView.swift
//  BradleysFinanceHub
//
//  Bank account linking with Plaid integration
//

import SwiftUI
import UIKit

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

