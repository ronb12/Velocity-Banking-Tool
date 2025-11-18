//
//  DataImportView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI
import UniformTypeIdentifiers

struct DataImportView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var dataService: DataService
    @State private var importText = ""
    @State private var isImporting = false
    @State private var importMessage: String?
    @State private var showingFilePicker = false
    @State private var importType: ImportType = .csv
    
    enum ImportType: String, CaseIterable {
        case csv = "CSV"
        case json = "JSON"
        case manual = "Manual Entry"
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section("Import Format") {
                    Picker("Format", selection: $importType) {
                        ForEach(ImportType.allCases, id: \.self) { type in
                            Text(type.rawValue).tag(type)
                        }
                    }
                }
                
                if importType == .manual {
                    Section("Paste Data") {
                        TextEditor(text: $importText)
                            .frame(height: 200)
                    }
                } else {
                    Section {
                        Button(action: { showingFilePicker = true }) {
                            HStack {
                                Image(systemName: "doc.badge.plus")
                                Text("Select File")
                            }
                        }
                    }
                }
                
                if let message = importMessage {
                    Section {
                        Text(message)
                            .foregroundColor(.secondary)
                            .font(.caption)
                    }
                }
                
                Section {
                    Button(action: { importData() }) {
                        HStack {
                            if isImporting {
                                ProgressView()
                                    .scaleEffect(0.8)
                            }
                            Text(isImporting ? "Importing..." : "Import Data")
                        }
                    }
                    .disabled(importText.isEmpty && importType == .manual || isImporting)
                }
            }
            .navigationTitle("Import Data")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .fileImporter(
                isPresented: $showingFilePicker,
                allowedContentTypes: [.commaSeparatedText, .json],
                allowsMultipleSelection: false
            ) { result in
                handleFileSelection(result)
            }
        }
    }
    
    private func handleFileSelection(_ result: Result<[URL], Error>) {
        switch result {
        case .success(let urls):
            if let url = urls.first {
                do {
                    importText = try String(contentsOf: url)
                    importMessage = "File loaded: \(url.lastPathComponent)"
                } catch {
                    importMessage = "Error reading file: \(error.localizedDescription)"
                }
            }
        case .failure(let error):
            importMessage = "Error selecting file: \(error.localizedDescription)"
        }
    }
    
    private func importData() {
        isImporting = true
        importMessage = nil
        
        Task {
            let importService = DataImportService()
            
            switch importType {
            case .csv, .manual:
                let transactions = importService.importTransactions(from: importText)
                // Save transactions to DataService
                for transaction in transactions {
                    try? await dataService.saveTransaction(transaction)
                }
                
                await MainActor.run {
                    isImporting = false
                    importMessage = "✅ Data imported successfully!"
                    importText = ""
                    
                    // Dismiss after a short delay
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                        dismiss()
                    }
                }
            case .json:
                // JSON import would go here
                await MainActor.run {
                    isImporting = false
                    importMessage = "JSON import not yet implemented"
                }
            }
        }
    }
}

