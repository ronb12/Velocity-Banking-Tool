//
//  NetWorthView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct NetWorthView: View {
    @EnvironmentObject var dataService: DataService
    @State private var netWorthHistory: [NetWorth] = []
    @State private var assets: Double = 0
    @State private var liabilities: Double = 0
    @State private var isLoading = true
    
    var netWorth: Double {
        assets - liabilities
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    VStack(spacing: 16) {
                        Text("Net Worth")
                            .font(.title)
                            .fontWeight(.bold)
                        
                        Text("$\(String(format: "%.2f", netWorth))")
                            .font(.system(size: 48, weight: .bold))
                            .foregroundColor(netWorth >= 0 ? .green : .red)
                        
                        HStack(spacing: 32) {
                            VStack {
                                Text("Assets")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text("$\(String(format: "%.2f", assets))")
                                    .font(.title3)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.green)
                            }
                            
                            VStack {
                                Text("Liabilities")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text("$\(String(format: "%.2f", liabilities))")
                                    .font(.title3)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.red)
                            }
                        }
                    }
                    .padding()
                    
                    if isLoading {
                        ProgressView()
                    }
                }
            }
            .navigationTitle("Net Worth")
            .task {
                await loadNetWorth()
            }
        }
    }
    
    private func loadNetWorth() async {
        do {
            netWorthHistory = try await dataService.fetchNetWorthHistory()
            if let latest = netWorthHistory.first {
                assets = latest.assets
                liabilities = latest.liabilities
            }
            isLoading = false
        } catch {
            print("Error loading net worth: \(error)")
            isLoading = false
        }
    }
}

