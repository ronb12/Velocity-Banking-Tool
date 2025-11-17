//
//  AccountsView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct AccountsView: View {
    @State private var accounts: [Account] = []
    @State private var showingAddAccount = false
    
    var body: some View {
        NavigationView {
            List {
                ForEach(accounts) { account in
                    AccountRowView(account: account)
                }
                .onDelete(perform: deleteAccount)
            }
            .navigationTitle("Accounts")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddAccount = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddAccount) {
                AddAccountView()
            }
        }
    }
    
    private func deleteAccount(at offsets: IndexSet) {
        accounts.remove(atOffsets: offsets)
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
    @State private var name = ""
    @State private var type: Account.AccountType = .checking
    @State private var balance = ""
    
    var body: some View {
        NavigationView {
            Form {
                TextField("Account Name", text: $name)
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
                    Button("Save") { dismiss() }
                }
            }
        }
    }
}

