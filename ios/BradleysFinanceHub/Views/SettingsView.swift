//
//  SettingsView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var dataService: DataService
    @StateObject private var themeManager = ThemeManager()
    @State private var showingExport = false
    @State private var showingImport = false
    
    var body: some View {
        NavigationView {
            Form {
                Section("Appearance") {
                    Picker("Theme", selection: $themeManager.currentTheme) {
                        ForEach(AppTheme.allCases, id: \.self) { theme in
                            Text(theme.displayName).tag(theme)
                        }
                    }
                }
                
                Section("Data") {
                    Button("Export Data") {
                        showingExport = true
                    }
                    Button("Import Data") {
                        showingImport = true
                    }
                }
                
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .sheet(isPresented: $showingExport) {
                DataExportView(dataService: dataService)
            }
            .sheet(isPresented: $showingImport) {
                DataImportView()
            }
        }
    }
}

struct DataExportView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    @State private var exportText = ""
    
    var body: some View {
        NavigationView {
            VStack {
                TextEditor(text: $exportText)
                    .padding()
            }
            .navigationTitle("Export Data")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
            .task {
                await generateExport()
            }
        }
    }
    
    private func generateExport() async {
        do {
            let transactions = try await dataService.fetchTransactions()
            let exportService = DataExportService()
            exportText = exportService.exportTransactions(transactions)
        } catch {
            exportText = "Error exporting data"
        }
    }
}

