//
//  AccountsView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-16.
//

import SwiftUI

struct AccountsView: View {
    @EnvironmentObject var dataService: DataService
    @StateObject private var autoImportService: AutoImportService
    @State private var accounts: [Account] = []
    @State private var showAddSheet = false
    @State private var showBankLinkSheet = false
    @State private var showImportSheet = false
    @State private var selectedAccount: Account?
    @State private var isImporting = false
    
    init() {
        // Initialize with nil - will be updated via environment object in .task
        // This prevents creating a duplicate CoreDataStack which can cause crashes
        _autoImportService = StateObject(wrappedValue: AutoImportService(dataService: nil))
    }
    
    var totalBalance: Double {
        accounts.filter { $0.isActive }.reduce(0) { $0 + $1.balance }
    }
    
    var body: some View {
        NavigationView {
            List {
                Section {
                    HStack {
                        Text("Total Balance")
                            .font(.headline)
                        Spacer()
                        Text(formatCurrency(totalBalance))
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(totalBalance >= 0 ? .green : .red)
                    }
                    .padding(.vertical, 8)
                }
                
                ForEach(accounts.filter { $0.isActive }) { account in
                    AccountRow(account: account)
                        .swipeActions(edge: .trailing) {
                            Button("Edit") {
                                selectedAccount = account
                            }
                            .tint(.blue)
                            
                            Button("Delete", role: .destructive) {
                                Task {
                                    try? await dataService.deleteAccount(account)
                                    await loadAccounts()
                                }
                            }
                        }
                }
                
                Section("Inactive") {
                    ForEach(accounts.filter { !$0.isActive }) { account in
                        AccountRow(account: account)
                    }
                }
                
                Section("Auto-Import") {
                    if autoImportService.connectedAccounts.isEmpty {
                        Button {
                            showBankLinkSheet = true
                        } label: {
                            HStack {
                                Image(systemName: "link")
                                Text("Link Bank Account")
                            }
                        }
                        Text("Connect your bank to automatically import transactions")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    } else {
                        ForEach(autoImportService.connectedAccounts) { bankAccount in
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(bankAccount.name)
                                        .font(.headline)
                                    Text(bankAccount.institution)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    if let lastSync = bankAccount.lastSyncDate {
                                        Text("Last synced: \(lastSync, style: .relative)")
                                            .font(.caption2)
                                            .foregroundColor(.secondary)
                                    } else {
                                        Text("Never synced")
                                            .font(.caption2)
                                            .foregroundColor(.orange)
                                    }
                                }
                                Spacer()
                                if bankAccount.isConnected {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.green)
                                }
                            }
                        }
                        
                        Button {
                            Task {
                                isImporting = true
                                do {
                                    _ = try await autoImportService.importTransactions()
                                } catch {
                                    print("Import error: \(error)")
                                }
                                isImporting = false
                            }
                        } label: {
                            HStack {
                                if isImporting {
                                    ProgressView()
                                } else {
                                    Image(systemName: "arrow.clockwise")
                                }
                                Text(isImporting ? "Importing..." : "Import Transactions")
                            }
                        }
                        .disabled(isImporting)
                        
                        Button {
                            showBankLinkSheet = true
                        } label: {
                            HStack {
                                Image(systemName: "plus.circle")
                                Text("Add Another Bank")
                            }
                        }
                    }
                }
            }
            .navigationTitle("Accounts")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button {
                            showAddSheet = true
                        } label: {
                            Label("Add Manual Account", systemImage: "plus")
                        }
                        
                        Button {
                            showBankLinkSheet = true
                        } label: {
                            Label("Link Bank Account", systemImage: "link")
                        }
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showAddSheet) {
                AddAccountView()
            }
            .sheet(item: $selectedAccount) { account in
                EditAccountView(account: account)
            }
            .sheet(isPresented: $showBankLinkSheet) {
                // TODO: Implement LinkBankAccountView
                Text("Bank Account Linking\n(Coming Soon)")
                    .padding()
            }
            .task {
                await loadAccounts()
                // Update autoImportService with environment dataService
                autoImportService.updateDataService(dataService)
            }
        }
    }
    
    private func loadAccounts() async {
        do {
            accounts = try await dataService.fetchAccounts()
        } catch {
            print("Error loading accounts: \(error)")
        }
    }
    
    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

struct AccountRow: View {
    let account: Account
    
    var body: some View {
        HStack {
            Image(systemName: account.type.icon)
                .font(.title2)
                .foregroundColor(.blue)
                .frame(width: 40)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(account.name)
                    .font(.headline)
                
                HStack {
                    Text(account.type.displayName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if let institution = account.institution {
                        Text("• \(institution)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text(formatCurrency(account.balance))
                    .font(.headline)
                    .foregroundColor(account.balance >= 0 ? .green : .red)
                
                if let accountNumber = account.accountNumber {
                    Text("••••\(accountNumber)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
    
    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

struct AddAccountView: View {
    @EnvironmentObject var dataService: DataService
    @Environment(\.dismiss) var dismiss
    
    @State private var name = ""
    @State private var type: Account.AccountType = .checking
    @State private var balance = ""
    @State private var institution = ""
    @State private var accountNumber = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section("Account Details") {
                    TextField("Account Name", text: $name)
                    
                    Picker("Type", selection: $type) {
                        ForEach(Account.AccountType.allCases, id: \.self) { accountType in
                            Text(accountType.displayName).tag(accountType)
                        }
                    }
                    
                    TextField("Balance", text: $balance)
                        .keyboardType(.decimalPad)
                    
                    TextField("Institution (Optional)", text: $institution)
                    
                    TextField("Last 4 Digits (Optional)", text: $accountNumber)
                        .keyboardType(.numberPad)
                }
                
                Section {
                    Button("Save") {
                        Task {
                            guard let balanceValue = Double(balance) else { return }
                            let account = Account(
                                name: name,
                                type: type,
                                balance: balanceValue,
                                institution: institution.isEmpty ? nil : institution,
                                accountNumber: accountNumber.isEmpty ? nil : accountNumber
                            )
                            try? await dataService.saveAccount(account)
                            dismiss()
                        }
                    }
                    .disabled(name.isEmpty || balance.isEmpty)
                }
            }
            .navigationTitle("Add Account")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

struct EditAccountView: View {
    @EnvironmentObject var dataService: DataService
    @Environment(\.dismiss) var dismiss
    
    let account: Account
    @State private var name: String
    @State private var type: Account.AccountType
    @State private var balance: String
    @State private var institution: String
    @State private var accountNumber: String
    @State private var isActive: Bool
    
    init(account: Account) {
        self.account = account
        _name = State(initialValue: account.name)
        _type = State(initialValue: account.type)
        _balance = State(initialValue: String(account.balance))
        _institution = State(initialValue: account.institution ?? "")
        _accountNumber = State(initialValue: account.accountNumber ?? "")
        _isActive = State(initialValue: account.isActive)
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section("Account Details") {
                    TextField("Account Name", text: $name)
                    
                    Picker("Type", selection: $type) {
                        ForEach(Account.AccountType.allCases, id: \.self) { accountType in
                            Text(accountType.displayName).tag(accountType)
                        }
                    }
                    
                    TextField("Balance", text: $balance)
                        .keyboardType(.decimalPad)
                    
                    TextField("Institution", text: $institution)
                    
                    TextField("Last 4 Digits", text: $accountNumber)
                        .keyboardType(.numberPad)
                    
                    Toggle("Active", isOn: $isActive)
                }
                
                Section {
                    Button("Save") {
                        Task {
                            guard let balanceValue = Double(balance) else { return }
                            var updated = account
                            updated.name = name
                            updated.type = type
                            updated.balance = balanceValue
                            updated.institution = institution.isEmpty ? nil : institution
                            updated.accountNumber = accountNumber.isEmpty ? nil : accountNumber
                            updated.isActive = isActive
                            try? await dataService.saveAccount(updated)
                            dismiss()
                        }
                    }
                }
            }
            .navigationTitle("Edit Account")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

