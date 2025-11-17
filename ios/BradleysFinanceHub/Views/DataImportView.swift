//
//  DataImportView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct DataImportView: View {
    @Environment(\.dismiss) var dismiss
    @State private var importText = ""
    
    var body: some View {
        NavigationView {
            VStack {
                TextEditor(text: $importText)
                    .padding()
                    .border(Color.gray, width: 1)
                
                Button("Import") {
                    // Import logic would go here
                    dismiss()
                }
                .padding()
            }
            .navigationTitle("Import Data")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

