//
//  BudgetTemplateView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct BudgetTemplateView: View {
    let templates = [
        BudgetTemplate(name: "50/30/20 Rule", description: "50% needs, 30% wants, 20% savings"),
        BudgetTemplate(name: "Zero-Based", description: "Every dollar assigned a purpose"),
        BudgetTemplate(name: "Envelope Method", description: "Cash-based budgeting system")
    ]
    
    var body: some View {
        NavigationView {
            List {
                ForEach(templates) { template in
                    BudgetTemplateRowView(template: template)
                }
            }
            .navigationTitle("Budget Templates")
        }
    }
}

struct BudgetTemplate: Identifiable {
    let id = UUID()
    let name: String
    let description: String
}

struct BudgetTemplateRowView: View {
    let template: BudgetTemplate
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(template.name)
                .font(.headline)
            Text(template.description)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}

