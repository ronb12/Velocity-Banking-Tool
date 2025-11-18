//
//  AIInsightsView.swift
//  BradleysFinanceHub
//
//  AI-powered insights and recommendations
//

import SwiftUI

struct AIInsightsView: View {
    @EnvironmentObject var dataService: DataService
    @StateObject private var aiService = AIInsightsService.shared
    @State private var transactions: [Transaction] = []
    @State private var budgets: [Budget] = []
    @State private var debts: [Debt] = []
    @State private var predictions: Double = 0
    @State private var anomalies: [SpendingAnomaly] = []
    @State private var trends: [String: SpendingTrend] = [:]
    @State private var recommendations: [Recommendation] = []
    @State private var isLoading = true
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    if isLoading {
                        ProgressView()
                            .padding()
                    } else {
                        // Predictions Card
                        PredictionCard(predictedSpending: predictions)
                        
                        // Recommendations
                        if !recommendations.isEmpty {
                            RecommendationsSection(recommendations: recommendations)
                        }
                        
                        // Anomalies
                        if !anomalies.isEmpty {
                            AnomaliesSection(anomalies: anomalies)
                        }
                        
                        // Spending Trends
                        if !trends.isEmpty {
                            TrendsSection(trends: trends)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("AI Insights")
            .task {
                await loadData()
            }
        }
    }
    
    private func loadData() async {
        do {
            transactions = try await dataService.fetchTransactions()
            budgets = try await dataService.fetchBudgets()
            debts = try await dataService.fetchDebts()
            
            // Generate insights
            predictions = aiService.predictMonthlySpending(transactions: transactions)
            anomalies = aiService.detectAnomalies(transactions: transactions)
            recommendations = aiService.generateRecommendations(
                transactions: transactions,
                budgets: budgets,
                debts: debts
            )
            
            // Get trends for top categories
            let topCategories = Dictionary(grouping: transactions.filter { $0.type == .expense }, by: { $0.category })
                .mapValues { $0.reduce(0) { $0 + $1.amount } }
                .sorted { $0.value > $1.value }
                .prefix(5)
                .map { $0.key }
            
            for category in topCategories {
                trends[category] = aiService.analyzeSpendingTrend(transactions: transactions, category: category)
            }
            
            isLoading = false
        } catch {
            print("Error loading insights: \(error)")
            isLoading = false
        }
    }
}

struct PredictionCard: View {
    let predictedSpending: Double
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .foregroundColor(.blue)
                Text("Predicted Monthly Spending")
                    .font(.headline)
                Spacer()
            }
            
            Text("$\(String(format: "%.2f", predictedSpending))")
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(.primary)
            
            Text("Based on your spending patterns")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(
            LinearGradient(
                gradient: Gradient(colors: [Color.blue.opacity(0.1), Color.purple.opacity(0.1)]),
                startPoint: .leading,
                endPoint: .trailing
            )
        )
        .cornerRadius(16)
    }
}

struct RecommendationsSection: View {
    let recommendations: [Recommendation]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recommendations")
                .font(.headline)
                .padding(.horizontal)
            
            ForEach(recommendations) { recommendation in
                RecommendationCard(recommendation: recommendation)
                    .padding(.horizontal)
            }
        }
    }
}

struct RecommendationCard: View {
    let recommendation: Recommendation
    
    var iconColor: Color {
        switch recommendation.priority {
        case .high: return .red
        case .medium: return .orange
        case .low: return .blue
        }
    }
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "lightbulb.fill")
                .foregroundColor(iconColor)
                .font(.title3)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(recommendation.title)
                    .font(.headline)
                Text(recommendation.message)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct AnomaliesSection: View {
    let anomalies: [SpendingAnomaly]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Spending Anomalies")
                .font(.headline)
                .padding(.horizontal)
            
            ForEach(anomalies.prefix(5)) { anomaly in
                AnomalyCard(anomaly: anomaly)
                    .padding(.horizontal)
            }
        }
    }
}

struct AnomalyCard: View {
    let anomaly: SpendingAnomaly
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.orange)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(anomaly.message)
                    .font(.subheadline)
                Text(anomaly.category)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text("$\(String(format: "%.2f", anomaly.amount))")
                .font(.subheadline)
                .fontWeight(.semibold)
        }
        .padding()
        .background(Color.orange.opacity(0.1))
        .cornerRadius(12)
    }
}

struct TrendsSection: View {
    let trends: [String: SpendingTrend]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Spending Trends")
                .font(.headline)
                .padding(.horizontal)
            
            ForEach(Array(trends.keys), id: \.self) { category in
                if let trend = trends[category] {
                    TrendCard(category: category, trend: trend)
                        .padding(.horizontal)
                }
            }
        }
    }
}

struct TrendCard: View {
    let category: String
    let trend: SpendingTrend
    
    var trendIcon: String {
        switch trend.direction {
        case .increasing: return "arrow.up.right"
        case .decreasing: return "arrow.down.right"
        case .stable: return "arrow.right"
        }
    }
    
    var trendColor: Color {
        switch trend.direction {
        case .increasing: return .red
        case .decreasing: return .green
        case .stable: return .gray
        }
    }
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(category)
                    .font(.headline)
                Text(trend.message)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            HStack(spacing: 4) {
                Image(systemName: trendIcon)
                    .font(.caption)
                Text("\(String(format: "%.1f", trend.percentage))%")
                    .font(.subheadline)
            }
            .foregroundColor(trendColor)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

