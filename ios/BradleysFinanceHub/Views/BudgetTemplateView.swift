//
//  BudgetTemplateView.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

struct BudgetTemplateView: View {
    let templates = BudgetTemplate.predefinedTemplates
    
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

