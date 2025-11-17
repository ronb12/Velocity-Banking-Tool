//
//  NetWorthBreakdownView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct NetWorthBreakdownView: View {
    @State private var assets: [NetWorthCategory] = []
    @State private var liabilities: [NetWorthCategory] = []
    
    var totalAssets: Double {
        assets.reduce(0) { $0 + $1.amount }
    }
    
    var totalLiabilities: Double {
        liabilities.reduce(0) { $0 + $1.amount }
    }
    
    var body: some View {
        NavigationView {
            List {
                Section("Assets") {
                    ForEach(assets) { asset in
                        HStack {
                            Text(asset.name)
                            Spacer()
                            Text("$\(String(format: "%.2f", asset.amount))")
                                .foregroundColor(.green)
                        }
                    }
                    HStack {
                        Text("Total Assets")
                            .fontWeight(.bold)
                        Spacer()
                        Text("$\(String(format: "%.2f", totalAssets))")
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                    }
                }
                
                Section("Liabilities") {
                    ForEach(liabilities) { liability in
                        HStack {
                            Text(liability.name)
                            Spacer()
                            Text("$\(String(format: "%.2f", liability.amount))")
                                .foregroundColor(.red)
                        }
                    }
                    HStack {
                        Text("Total Liabilities")
                            .fontWeight(.bold)
                        Spacer()
                        Text("$\(String(format: "%.2f", totalLiabilities))")
                            .fontWeight(.bold)
                            .foregroundColor(.red)
                    }
                }
                
                Section("Net Worth") {
                    HStack {
                        Text("Total")
                            .fontWeight(.bold)
                        Spacer()
                        Text("$\(String(format: "%.2f", totalAssets - totalLiabilities))")
                            .fontWeight(.bold)
                            .foregroundColor(totalAssets - totalLiabilities >= 0 ? .green : .red)
                    }
                }
            }
            .navigationTitle("Net Worth Breakdown")
        }
    }
}

