//
//  ToolsView.swift
//  BradleysFinanceHub
//
//  Consolidated view for Calculators and Tools
//

import SwiftUI

struct ToolsView: View {
    @EnvironmentObject var dataService: DataService
    @State private var selectedTool: ToolOption?
    
    enum ToolOption: String, Identifiable {
        case creditScore = "Credit Score"
        case velocity = "Velocity Banking"
        case receiptScanner = "Receipt Scanner"
        case challenges = "Challenges"
        case notifications = "Alerts"
        
        var id: String { rawValue }
        
        var icon: String {
            switch self {
            case .creditScore: return "gauge"
            case .velocity: return "function"
            case .receiptScanner: return "doc.text.viewfinder"
            case .challenges: return "book.fill"
            case .notifications: return "bell.badge.fill"
            }
        }
    }
    
    var body: some View {
        NavigationView {
            List {
                ToolRow(option: .creditScore, selectedTool: $selectedTool)
                ToolRow(option: .velocity, selectedTool: $selectedTool)
                ToolRow(option: .receiptScanner, selectedTool: $selectedTool)
                ToolRow(option: .challenges, selectedTool: $selectedTool)
                ToolRow(option: .notifications, selectedTool: $selectedTool)
            }
            .navigationTitle("Tools")
            .sheet(item: $selectedTool) { tool in
                toolView(for: tool)
            }
        }
    }
    
    @ViewBuilder
    private func toolView(for tool: ToolOption) -> some View {
        switch tool {
        case .creditScore:
            CreditScoreEstimatorView()
        case .velocity:
            VelocityCalculatorView()
                .environmentObject(dataService)
        case .receiptScanner:
            ReceiptScannerView()
                .environmentObject(dataService)
        case .challenges:
            ChallengeLibraryView()
        case .notifications:
            NotificationsView()
        }
    }
}

struct ToolRow: View {
    let option: ToolsView.ToolOption
    @Binding var selectedTool: ToolsView.ToolOption?
    
    var body: some View {
        Button(action: {
            selectedTool = option
        }) {
            HStack {
                Image(systemName: option.icon)
                    .foregroundColor(.blue)
                    .frame(width: 30)
                Text(option.rawValue)
                    .foregroundColor(.primary)
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
        }
    }
}

