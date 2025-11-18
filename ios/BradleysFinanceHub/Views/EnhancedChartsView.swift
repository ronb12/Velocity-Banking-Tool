//
//  EnhancedChartsView.swift
//  BradleysFinanceHub
//
//  Enhanced visualizations with year-over-year comparisons
//

import SwiftUI
import Charts

struct EnhancedChartsView: View {
    @EnvironmentObject var dataService: DataService
    @State private var transactions: [Transaction] = []
    @State private var selectedYear: Int = Calendar.current.component(.year, from: Date())
    @State private var comparisonMode: ComparisonMode = .yearOverYear
    
    enum ComparisonMode {
        case yearOverYear
        case monthOverMonth
        case categoryComparison
    }
    
    var availableYears: [Int] {
        let years = Set(transactions.map { Calendar.current.component(.year, from: $0.date) })
        return Array(years).sorted(by: >)
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Year Selector
                    Picker("Year", selection: $selectedYear) {
                        ForEach(availableYears, id: \.self) { year in
                            Text("\(year)").tag(year)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal)
                    
                    // Comparison Mode Selector
                    Picker("Comparison", selection: $comparisonMode) {
                        Text("Year-over-Year").tag(ComparisonMode.yearOverYear)
                        Text("Month-over-Month").tag(ComparisonMode.monthOverMonth)
                        Text("Category").tag(ComparisonMode.categoryComparison)
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal)
                    
                    // Year-over-Year Chart
                    if comparisonMode == .yearOverYear {
                        YearOverYearChart(transactions: transactions, selectedYear: selectedYear)
                    }
                    
                    // Month-over-Month Chart
                    if comparisonMode == .monthOverMonth {
                        MonthOverMonthChart(transactions: transactions, selectedYear: selectedYear)
                    }
                    
                    // Category Comparison
                    if comparisonMode == .categoryComparison {
                        CategoryComparisonChart(transactions: transactions, selectedYear: selectedYear)
                    }
                    
                    // Spending Trends
                    SpendingTrendsChart(transactions: transactions, selectedYear: selectedYear)
                    
                    // Export Button
                    ExportButton(transactions: transactions, dataService: dataService)
                }
                .padding()
            }
            .navigationTitle("Enhanced Charts")
            .task {
                await loadTransactions()
            }
        }
    }
    
    private func loadTransactions() async {
        do {
            transactions = try await dataService.fetchTransactions()
        } catch {
            print("Error loading transactions: \(error)")
        }
    }
}

struct YearOverYearChart: View {
    let transactions: [Transaction]
    let selectedYear: Int
    
    var yearData: [(year: Int, total: Double)] {
        let calendar = Calendar.current
        let currentYear = calendar.component(.year, from: Date())
        let years = [selectedYear - 1, selectedYear]
        
        return years.map { year in
            let yearTransactions = transactions.filter {
                calendar.component(.year, from: $0.date) == year && $0.type == .expense
            }
            let total = yearTransactions.reduce(0) { $0 + $1.amount }
            return (year: year, total: total)
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Year-over-Year Comparison")
                .font(.headline)
            
            if yearData.count == 2 {
                let previousYear = yearData[0]
                let currentYear = yearData[1]
                let change = currentYear.total - previousYear.total
                let percentChange = previousYear.total > 0 ? (change / previousYear.total) * 100 : 0
                
                HStack(spacing: 20) {
                    VStack(alignment: .leading) {
                        Text("\(previousYear.year)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("$\(String(format: "%.2f", previousYear.total))")
                            .font(.title2)
                            .fontWeight(.bold)
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .center) {
                        Image(systemName: change >= 0 ? "arrow.up.right" : "arrow.down.right")
                            .foregroundColor(change >= 0 ? .red : .green)
                        Text("\(String(format: "%.1f", abs(percentChange)))%")
                            .font(.headline)
                            .foregroundColor(change >= 0 ? .red : .green)
                        Text("$\(String(format: "%.2f", abs(change)))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing) {
                        Text("\(currentYear.year)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("$\(String(format: "%.2f", currentYear.total))")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(change >= 0 ? .red : .green)
                    }
                }
                
                // Visual bars
                GeometryReader { geometry in
                    HStack(spacing: 0) {
                        // Previous year bar
                        Rectangle()
                            .fill(Color.blue.opacity(0.6))
                            .frame(width: geometry.size.width * 0.45)
                        
                        Spacer()
                            .frame(width: geometry.size.width * 0.1)
                        
                        // Current year bar
                        Rectangle()
                            .fill(Color.green.opacity(0.6))
                            .frame(width: geometry.size.width * 0.45)
                    }
                }
                .frame(height: 40)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(16)
    }
}

struct MonthOverMonthChart: View {
    let transactions: [Transaction]
    let selectedYear: Int
    
    var monthlyData: [(month: Int, current: Double, previous: Double)] {
        let calendar = Calendar.current
        var data: [(month: Int, current: Double, previous: Double)] = []
        
        for month in 1...12 {
            let currentMonthTransactions = transactions.filter {
                let components = calendar.dateComponents([.year, .month], from: $0.date)
                return components.year == selectedYear &&
                       components.month == month &&
                       $0.type == .expense
            }
            
            let previousMonthTransactions = transactions.filter {
                let components = calendar.dateComponents([.year, .month], from: $0.date)
                let prevYear = components.month == 1 ? selectedYear - 1 : selectedYear
                let prevMonth = components.month == 1 ? 12 : components.month! - 1
                return components.year == prevYear &&
                       components.month == prevMonth &&
                       $0.type == .expense
            }
            
            data.append((
                month: month,
                current: currentMonthTransactions.reduce(0) { $0 + $1.amount },
                previous: previousMonthTransactions.reduce(0) { $0 + $1.amount }
            ))
        }
        
        return data
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Month-over-Month Comparison")
                .font(.headline)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(monthlyData, id: \.month) { data in
                        MonthComparisonBar(
                            month: data.month,
                            current: data.current,
                            previous: data.previous
                        )
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(16)
    }
}

struct MonthComparisonBar: View {
    let month: Int
    let current: Double
    let previous: Double
    
    var monthName: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM"
        let date = Calendar.current.date(from: DateComponents(year: 2024, month: month))!
        return formatter.string(from: date)
    }
    
    var change: Double {
        current - previous
    }
    
    var body: some View {
        VStack(spacing: 8) {
            Text(monthName)
                .font(.caption)
                .foregroundColor(.secondary)
            
            VStack(spacing: 4) {
                // Previous month
                Rectangle()
                    .fill(Color.blue.opacity(0.5))
                    .frame(width: 40, height: CGFloat(max(previous / 100, 10)))
                
                // Current month
                Rectangle()
                    .fill(Color.green.opacity(0.7))
                    .frame(width: 40, height: CGFloat(max(current / 100, 10)))
            }
            
            Text("$\(String(format: "%.0f", current))")
                .font(.caption2)
                .foregroundColor(.primary)
            
            if previous > 0 {
                let percentChange = (change / previous) * 100
                Text("\(percentChange >= 0 ? "+" : "")\(String(format: "%.0f", percentChange))%")
                    .font(.caption2)
                    .foregroundColor(change >= 0 ? .red : .green)
            }
        }
    }
}

struct CategoryComparisonChart: View {
    let transactions: [Transaction]
    let selectedYear: Int
    
    var categoryData: [(category: String, current: Double, previous: Double)] {
        let calendar = Calendar.current
        let currentYearTransactions = transactions.filter {
            calendar.component(.year, from: $0.date) == selectedYear && $0.type == .expense
        }
        let previousYearTransactions = transactions.filter {
            calendar.component(.year, from: $0.date) == selectedYear - 1 && $0.type == .expense
        }
        
        let currentCategories = Dictionary(grouping: currentYearTransactions, by: { $0.category })
        let previousCategories = Dictionary(grouping: previousYearTransactions, by: { $0.category })
        
        let allCategories = Set(currentCategories.keys).union(Set(previousCategories.keys))
        
        return allCategories.map { category in
            let current = currentCategories[category]?.reduce(0) { $0 + $1.amount } ?? 0
            let previous = previousCategories[category]?.reduce(0) { $0 + $1.amount } ?? 0
            return (category: category, current: current, previous: previous)
        }.sorted { $0.current > $1.current }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Category Comparison")
                .font(.headline)
            
            ForEach(categoryData.prefix(10), id: \.category) { data in
                CategoryComparisonRow(
                    category: data.category,
                    current: data.current,
                    previous: data.previous
                )
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(16)
    }
}

struct CategoryComparisonRow: View {
    let category: String
    let current: Double
    let previous: Double
    
    var change: Double {
        current - previous
    }
    
    var percentChange: Double {
        previous > 0 ? (change / previous) * 100 : 0
    }
    
    var body: some View {
        HStack {
            Text(category)
                .font(.subheadline)
                .frame(width: 100, alignment: .leading)
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text("$\(String(format: "%.2f", current))")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                if previous > 0 {
                    HStack(spacing: 4) {
                        Image(systemName: change >= 0 ? "arrow.up" : "arrow.down")
                            .font(.caption2)
                        Text("\(String(format: "%.1f", abs(percentChange)))%")
                            .font(.caption2)
                    }
                    .foregroundColor(change >= 0 ? .red : .green)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct SpendingTrendsChart: View {
    let transactions: [Transaction]
    let selectedYear: Int
    
    var monthlyTrends: [(month: String, amount: Double)] {
        let calendar = Calendar.current
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM"
        
        var data: [(month: String, amount: Double)] = []
        
        for month in 1...12 {
            let monthTransactions = transactions.filter {
                let components = calendar.dateComponents([.year, .month], from: $0.date)
                return components.year == selectedYear &&
                       components.month == month &&
                       $0.type == .expense
            }
            
            let total = monthTransactions.reduce(0) { $0 + $1.amount }
            let date = calendar.date(from: DateComponents(year: selectedYear, month: month))!
            data.append((month: formatter.string(from: date), amount: total))
        }
        
        return data
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Monthly Spending Trends")
                .font(.headline)
            
            if !monthlyTrends.isEmpty {
                let maxAmount = monthlyTrends.map { $0.amount }.max() ?? 1
                
                ForEach(monthlyTrends, id: \.month) { trend in
                    HStack(spacing: 12) {
                        Text(trend.month)
                            .font(.subheadline)
                            .frame(width: 60, alignment: .leading)
                        
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                Rectangle()
                                    .fill(Color.gray.opacity(0.2))
                                    .frame(height: 20)
                                    .cornerRadius(10)
                                
                                Rectangle()
                                    .fill(LinearGradient(
                                        gradient: Gradient(colors: [.blue, .purple]),
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    ))
                                    .frame(
                                        width: geometry.size.width * min(trend.amount / maxAmount, 1.0),
                                        height: 20
                                    )
                                    .cornerRadius(10)
                            }
                        }
                        .frame(height: 20)
                        
                        Text("$\(String(format: "%.0f", trend.amount))")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .frame(width: 70, alignment: .trailing)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(16)
    }
}

struct ExportButton: View {
    let transactions: [Transaction]
    let dataService: DataService
    @State private var showingShareSheet = false
    @State private var pdfData: Data?
    
    var body: some View {
        Button(action: {
            exportToPDF()
        }) {
            HStack {
                Image(systemName: "square.and.arrow.up")
                Text("Export to PDF")
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(12)
        }
        .sheet(isPresented: $showingShareSheet) {
            if let pdfData = pdfData {
                ShareSheet(activityItems: [pdfData])
            }
        }
    }
    
    private func exportToPDF() {
        Task {
            do {
                let budgets = try await dataService.fetchBudgets()
                let debts = try await dataService.fetchDebts()
                let goals = try await dataService.fetchSavingsGoals()
                
                let exportService = DataExportService()
                pdfData = exportService.generatePDFReport(
                    transactions: transactions,
                    budgets: budgets,
                    debts: debts,
                    savingsGoals: goals
                )
                
                await MainActor.run {
                    showingShareSheet = true
                }
            } catch {
                print("Error generating PDF: \(error)")
            }
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

