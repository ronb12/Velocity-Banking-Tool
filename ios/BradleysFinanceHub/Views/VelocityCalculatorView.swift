//
//  VelocityCalculatorView.swift
//  BradleysFinanceHub
//
//  Full Velocity Banking Calculator with HELOC, Credit Cards, and Personal Lines
//

import SwiftUI

struct VelocityCalculatorView: View {
    @EnvironmentObject var dataService: DataService
    
    // Credit Type
    enum CreditType: String, CaseIterable {
        case heloc = "HELOC"
        case creditCard = "Credit Card"
        case personalLine = "Personal Line"
        
        var icon: String {
            switch self {
            case .heloc: return "house.fill"
            case .creditCard: return "creditcard.fill"
            case .personalLine: return "line.3.horizontal"
            }
        }
    }
    
    @State private var creditType: CreditType = .heloc
    @State private var revolvingBalance: String = ""
    @State private var revolvingCreditLimit: String = ""
    @State private var interestRate: String = ""
    @State private var monthlyIncome: String = ""
    @State private var monthlyExpenses: String = ""
    @State private var enableChunking: Bool = false
    @State private var chunkAmount: String = ""
    @State private var chunkFrequency: Int = 1 // weeks
    
    var availableCash: Double {
        guard let income = Double(monthlyIncome),
              let expenses = Double(monthlyExpenses) else { return 0 }
        return income - expenses
    }
    
    var monthlyPayoffSchedule: [(month: Int, balance: Double, payment: Double, interest: Double, principal: Double)] {
        calculateVelocityPayoff()
    }
    
    var totalInterestPaid: Double {
        monthlyPayoffSchedule.reduce(0) { $0 + $1.interest }
    }
    
    var totalInterestSaved: Double {
        // Compare to traditional payoff (minimum payment only)
        guard let balance = Double(revolvingBalance),
              let apr = Double(interestRate),
              balance > 0, apr > 0 else { return 0 }
        
        // Calculate traditional minimum payment method using daily interest (same as velocity banking)
        // Convert APR (Annual Percentage Rate) to monthly rate
        // APR is entered as percentage (e.g., 18.99 for 18.99% APR)
        let monthlyRate = apr / 100.0 / 12.0
        var traditionalBalance = balance
        var traditionalInterest: Double = 0
        var month = 1
        
        while traditionalBalance > 0.01 && month <= 600 {
            // Calculate minimum payment for this month (typically 2% of current balance or $25, whichever is higher)
            let minPayment = max(traditionalBalance * 0.02, 25.0)
            
            // Calculate daily interest for the month (same method as velocity banking for fair comparison)
            let daysInMonth = Calendar.current.range(of: .day, in: .month, for: Calendar.current.date(byAdding: .month, value: month - 1, to: Date()) ?? Date())?.count ?? 30
            let dailyRate = monthlyRate / Double(daysInMonth)
            
            // Traditional method: Interest accumulates on the balance throughout the month
            // Calculate interest on the balance at start of month (no payments reduce balance during month)
            let balanceAtStart = traditionalBalance
            var monthlyInterest: Double = 0
            
            for _ in 1...daysInMonth {
                // Interest calculated on the balance at start of month (no payments during month)
                let dayInterest = balanceAtStart * dailyRate
                monthlyInterest += dayInterest
            }
            
            // Apply minimum payment at end of month (after interest has accumulated)
            traditionalInterest += monthlyInterest
            
            // Calculate new balance: start balance + interest - payment
            let newBalance = traditionalBalance + monthlyInterest - minPayment
            traditionalBalance = max(0, newBalance)
            
            // Safety check: if balance is growing significantly, break to prevent infinite loop
            // This happens when minimum payment is less than interest (debt trap)
            if newBalance > balanceAtStart * 1.1 && month > 1 {
                // Balance is growing - minimum payment is less than interest
                // Cap the calculation to prevent unrealistic numbers
                break
            }
            
            month += 1
        }
        
        // Calculate velocity banking total interest
        let velocityInterest = totalInterestPaid
        
        // Return the difference (savings)
        return max(0, traditionalInterest - velocityInterest)
    }
    
    var payoffMonths: Int {
        monthlyPayoffSchedule.count
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Credit Type Selector
                    CreditTypeSelector(creditType: $creditType)
                    
                    // Input Form
                    InputFormCard(
                        creditType: creditType,
                        revolvingBalance: $revolvingBalance,
                        revolvingCreditLimit: $revolvingCreditLimit,
                        interestRate: $interestRate,
                        monthlyIncome: $monthlyIncome,
                        monthlyExpenses: $monthlyExpenses,
                        enableChunking: $enableChunking,
                        chunkAmount: $chunkAmount,
                        chunkFrequency: $chunkFrequency
                    )
                    
                    // Results Summary
                    if !revolvingBalance.isEmpty && !interestRate.isEmpty && availableCash > 0 {
                        ResultsSummaryCard(
                            payoffMonths: payoffMonths,
                            totalInterestPaid: totalInterestPaid,
                            totalInterestSaved: totalInterestSaved,
                            availableCash: availableCash
                        )
                        
                        // Monthly Payoff Schedule
                        MonthlyPayoffTable(schedule: monthlyPayoffSchedule)
                    } else {
                        InfoBanner(creditType: creditType)
                    }
                }
                .padding()
            }
            .navigationTitle("Velocity Calculator")
        }
    }
    
    private func calculateVelocityPayoff() -> [(month: Int, balance: Double, payment: Double, interest: Double, principal: Double)] {
        guard let revolvingBal = Double(revolvingBalance),
              let apr = Double(interestRate),
              revolvingBal > 0, apr > 0 else {
            return []
        }
        
        var balance = revolvingBal
        // Convert APR (Annual Percentage Rate) to monthly rate
        // APR is entered as percentage (e.g., 18.99 for 18.99% APR)
        // Monthly rate = APR / 100 / 12
        let monthlyRate = apr / 100.0 / 12.0
        var schedule: [(month: Int, balance: Double, payment: Double, interest: Double, principal: Double)] = []
        var month = 1
        
        while balance > 0.01 && month <= 600 {
            // Calculate daily interest (velocity banking uses daily interest)
            // Get actual days in the month for accurate daily interest calculation
            let daysInMonth = Calendar.current.range(of: .day, in: .month, for: Calendar.current.date(byAdding: .month, value: month - 1, to: Date()) ?? Date())?.count ?? 30
            // Convert monthly rate to daily rate
            // Daily rate = Monthly rate / days in month
            let dailyRate = monthlyRate / Double(daysInMonth)
            
            // Velocity Banking Calculation:
            // 1. Income is deposited to HELOC/credit line immediately (reduces balance)
            // 2. Expenses are paid from HELOC/credit line (increases balance)
            // 3. Net cash flow (income - expenses) is the available payment
            // 4. This reduces the average daily balance, reducing daily interest
            
            // Calculate total payment for the month (available cash + chunking if enabled)
            var totalPayment = availableCash
            var chunkPaymentsThisMonth = 0.0
            
            if enableChunking, let chunk = Double(chunkAmount), chunk > 0 {
                // Calculate how many chunk payments occur this month (weekly frequency)
                let weeksInMonth = Double(daysInMonth) / 7.0
                let chunkCount = Int(weeksInMonth / Double(chunkFrequency))
                chunkPaymentsThisMonth = Double(chunkCount) * chunk
                totalPayment += chunkPaymentsThisMonth
            }
            
            // Calculate interest for the month using daily interest
            // In velocity banking, payments reduce the balance daily, which reduces daily interest
            
            var monthlyInterest: Double = 0
            var currentBalance = balance
            let balanceAtStart = balance
            
            // Calculate daily payment reduction (available cash spread throughout month)
            let dailyPaymentReduction = availableCash / Double(daysInMonth)
            
            // Simulate each day of the month
            for day in 1...daysInMonth {
                // Step 1: Calculate interest on the current balance for this day
                let dayInterest = currentBalance * dailyRate
                monthlyInterest += dayInterest
                
                // Step 2: Apply daily payment reduction (velocity banking: income deposited daily)
                currentBalance = max(0, currentBalance - dailyPaymentReduction)
                
                // Step 3: Apply chunking payments if enabled (weekly frequency)
                if enableChunking, let chunk = Double(chunkAmount), chunk > 0 {
                    let daysPerChunk = chunkFrequency * 7
                    if day % daysPerChunk == 0 && day <= daysInMonth {
                        currentBalance = max(0, currentBalance - chunk)
                    }
                }
            }
            
            // Calculate final balance for the month
            // The currentBalance variable now represents the balance after all payments
            // But we need to add the interest that accumulated
            // However, interest compounds daily, so we need to account for it properly
            
            // Correct calculation: Starting balance + interest - payments = ending balance
            // Since payments were already deducted from currentBalance, we need to:
            // Ending balance = currentBalance (after payments) + interest (that accumulated)
            // But wait - interest was calculated on the reducing balance, so it's already "baked in"
            // Actually: Final balance = Starting balance + Total interest - Total payments
            let newBalance = max(0, balanceAtStart + monthlyInterest - totalPayment)
            balance = newBalance
            
            // Verify: The currentBalance should approximately equal newBalance
            // (allowing for rounding differences from daily calculations)
            // If there's a significant difference, there's a logic error
            
            // Calculate principal paid (amount that reduces the original debt)
            let principal = max(0, totalPayment - monthlyInterest)
            
            schedule.append((month, balance, totalPayment, monthlyInterest, principal))
            month += 1
        }
        
        return schedule
    }
}

// MARK: - Credit Type Selector

struct CreditTypeSelector: View {
    @Binding var creditType: VelocityCalculatorView.CreditType
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Credit Type")
                .font(.headline)
            
            Picker("Credit Type", selection: $creditType) {
                ForEach(VelocityCalculatorView.CreditType.allCases, id: \.self) { type in
                    HStack {
                        Image(systemName: type.icon)
                        Text(type.rawValue)
                    }
                    .tag(type)
                }
            }
            .pickerStyle(.segmented)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

// MARK: - Input Form Card

struct InputFormCard: View {
    let creditType: VelocityCalculatorView.CreditType
    @Binding var revolvingBalance: String
    @Binding var revolvingCreditLimit: String
    @Binding var interestRate: String
    @Binding var monthlyIncome: String
    @Binding var monthlyExpenses: String
    @Binding var enableChunking: Bool
    @Binding var chunkAmount: String
    @Binding var chunkFrequency: Int
    
    func aprHelperText(for creditType: VelocityCalculatorView.CreditType) -> String {
        switch creditType {
        case .heloc:
            return "Enter HELOC APR (e.g., 5.25 for 5.25% APR). HELOCs typically use APR."
        case .creditCard:
            return "Enter Credit Card APR (e.g., 18.99 for 18.99% APR). Credit cards always use APR."
        case .personalLine:
            return "Enter Personal Line of Credit APR (e.g., 8.50 for 8.50% APR). Personal lines use APR."
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Input Details")
                .font(.headline)
            
            VStack(spacing: 12) {
                TextField("Current Balance", text: $revolvingBalance)
                    .keyboardType(.decimalPad)
                    .textFieldStyle(.roundedBorder)
                
                TextField("Credit Limit", text: $revolvingCreditLimit)
                    .keyboardType(.decimalPad)
                    .textFieldStyle(.roundedBorder)
                
                HStack {
                    TextField("APR (%)", text: $interestRate)
                        .keyboardType(.decimalPad)
                        .textFieldStyle(.roundedBorder)
                    Text("APR")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Text(aprHelperText(for: creditType))
                    .font(.caption2)
                    .foregroundColor(.secondary)
                
                Divider()
                
                TextField("Monthly Income", text: $monthlyIncome)
                    .keyboardType(.decimalPad)
                    .textFieldStyle(.roundedBorder)
                
                TextField("Monthly Expenses", text: $monthlyExpenses)
                    .keyboardType(.decimalPad)
                    .textFieldStyle(.roundedBorder)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                
                Divider()
                
                Toggle("Enable Chunking", isOn: $enableChunking)
                
                if enableChunking {
                    TextField("Chunk Amount", text: $chunkAmount)
                        .keyboardType(.decimalPad)
                        .textFieldStyle(.roundedBorder)
                    
                    Stepper("Chunk Every \(chunkFrequency) week\(chunkFrequency == 1 ? "" : "s")", value: $chunkFrequency, in: 1...4)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

// MARK: - Results Summary Card

struct ResultsSummaryCard: View {
    let payoffMonths: Int
    let totalInterestPaid: Double
    let totalInterestSaved: Double
    let availableCash: Double
    
    var body: some View {
        VStack(spacing: 16) {
            Text("Results Summary")
                .font(.headline)
            
            // Prominent Total Interest Saved Card
            InterestSavingsCard(amount: totalInterestSaved)
            
            VStack(spacing: 12) {
                ResultRow(label: "Payoff Time", value: "\(payoffMonths) months", color: .blue)
                ResultRow(label: "Total Interest Paid", value: "$\(String(format: "%.2f", totalInterestPaid))", color: .red)
                ResultRow(label: "Available Cash Flow", value: "$\(String(format: "%.2f", availableCash))", color: .blue)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

struct InterestSavingsCard: View {
    let amount: Double
    
    var body: some View {
        VStack(spacing: 8) {
            Text("Total Interest Saved")
                .font(.subheadline)
                .foregroundColor(.secondary)
            Text("$\(String(format: "%.2f", amount))")
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(.green)
            Text("vs. Traditional Method")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.green.opacity(0.1))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.green.opacity(0.3), lineWidth: 2)
        )
    }
}

struct ResultRow: View {
    let label: String
    let value: String
    let color: Color
    
    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(color)
        }
    }
}

// MARK: - Monthly Payoff Table

struct MonthlyPayoffTable: View {
    let schedule: [(month: Int, balance: Double, payment: Double, interest: Double, principal: Double)]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Monthly Payoff Schedule")
                .font(.headline)
            
            if schedule.isEmpty {
                Text("Enter values to see payoff schedule")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                ScrollView(.horizontal, showsIndicators: true) {
                    ScrollView(.vertical, showsIndicators: true) {
                        VStack(alignment: .leading, spacing: 0) {
                            // Header
                            HStack(spacing: 0) {
                                TableHeaderCell(text: "Month", width: 70)
                                TableHeaderCell(text: "Starting Balance", width: 110)
                                TableHeaderCell(text: "Payment", width: 100)
                                TableHeaderCell(text: "Interest", width: 100)
                                TableHeaderCell(text: "Principal", width: 100)
                                TableHeaderCell(text: "Ending Balance", width: 110)
                            }
                            .background(Color(.systemGray5))
                            
                            // Rows
                            ForEach(Array(schedule.enumerated()), id: \.offset) { index, row in
                                let startingBalance = index > 0 ? schedule[index - 1].balance : (row.balance + row.interest - row.payment)
                                
                                HStack(spacing: 0) {
                                    TableCell(text: "\(row.month)", width: 70)
                                    TableCell(text: "$\(String(format: "%.2f", startingBalance))", width: 110)
                                    TableCell(text: "$\(String(format: "%.2f", row.payment))", width: 100)
                                    TableCell(text: "$\(String(format: "%.2f", row.interest))", width: 100)
                                    TableCell(text: "$\(String(format: "%.2f", row.principal))", width: 100)
                                    TableCell(text: "$\(String(format: "%.2f", row.balance))", width: 110)
                                }
                                .background(index % 2 == 0 ? Color(.systemBackground) : Color(.systemGray6))
                            }
                        }
                        .frame(minWidth: 550) // Ensure minimum width for horizontal scrolling
                    }
                    .frame(maxHeight: 400) // Limit height to enable vertical scrolling
                }
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color(.systemGray4), lineWidth: 1)
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

struct TableHeaderCell: View {
    let text: String
    let width: CGFloat
    
    var body: some View {
        Text(text)
            .font(.caption)
            .fontWeight(.semibold)
            .frame(width: width, alignment: .center)
            .padding(.vertical, 8)
    }
}

struct TableCell: View {
    let text: String
    let width: CGFloat
    var color: Color = .primary
    
    var body: some View {
        Text(text)
            .font(.caption)
            .foregroundColor(color)
            .frame(width: width, alignment: .center)
            .padding(.vertical, 6)
    }
}

// MARK: - Info Banner

struct InfoBanner: View {
    let creditType: VelocityCalculatorView.CreditType
    
    var infoText: String {
        switch creditType {
        case .heloc:
            return "Velocity banking uses your HELOC to accelerate debt payoff by cycling income through the line of credit, reducing daily interest charges."
        case .creditCard:
            return "Velocity banking with credit cards involves using available credit to pay down balances faster, reducing interest accumulation."
        case .personalLine:
            return "Use your personal line of credit to implement velocity banking strategies and pay off debts more efficiently."
        }
    }
    
    var body: some View {
        HStack {
            Image(systemName: "info.circle.fill")
                .foregroundColor(.blue)
            Text(infoText)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color.blue.opacity(0.1))
        .cornerRadius(12)
    }
}
