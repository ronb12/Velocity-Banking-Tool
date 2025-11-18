//
//  BillsView.swift
//  BradleysFinanceHub
//
//  View for managing bills and bill reminders
//

import SwiftUI

struct BillsView: View {
    @EnvironmentObject var dataService: DataService
    
    var body: some View {
        NavigationView {
            BillsViewContent()
                .environmentObject(dataService)
        }
    }
}

struct BillsViewContent: View {
    @EnvironmentObject var dataService: DataService
    @State private var bills: [Bill] = []
    @State private var isLoading = true
    @State private var showingAddBill = false
    @State private var editingBill: Bill?
    
    var upcomingBills: [Bill] {
        bills.filter { !$0.isPaid && $0.dueDate >= Date() }.sorted { $0.dueDate < $1.dueDate }
    }
    
    var overdueBills: [Bill] {
        bills.filter { !$0.isPaid && $0.dueDate < Date() }
    }
    
    var paidBills: [Bill] {
        bills.filter { $0.isPaid }
    }
    
    var body: some View {
            Group {
                if isLoading {
                    ProgressView()
                } else if bills.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "doc.text.fill")
                            .font(.system(size: 50))
                            .foregroundColor(.secondary)
                        Text("No Bills Yet")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        Text("Tap the + button to add your first bill")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List {
                        if !overdueBills.isEmpty {
                            Section("⚠️ Overdue") {
                                ForEach(overdueBills) { bill in
                                    BillRowView(bill: bill)
                                        .onTapGesture {
                                            editingBill = bill
                                        }
                                }
                                .onDelete(perform: { offsets in
                                    deleteBills(at: offsets, from: overdueBills)
                                })
                            }
                        }
                        
                        if !upcomingBills.isEmpty {
                            Section("Upcoming") {
                                ForEach(upcomingBills) { bill in
                                    BillRowView(bill: bill)
                                        .onTapGesture {
                                            editingBill = bill
                                        }
                                }
                                .onDelete(perform: { offsets in
                                    deleteBills(at: offsets, from: upcomingBills)
                                })
                            }
                        }
                        
                        if !paidBills.isEmpty {
                            Section("Paid") {
                                ForEach(paidBills) { bill in
                                    BillRowView(bill: bill)
                                        .onTapGesture {
                                            editingBill = bill
                                        }
                                }
                                .onDelete(perform: { offsets in
                                    deleteBills(at: offsets, from: paidBills)
                                })
                            }
                        }
                    }
                }
            }
            .navigationTitle("Bills")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddBill = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddBill) {
                AddBillView(dataService: dataService)
                    .onDisappear { Task { await loadBills() } }
            }
            .sheet(item: $editingBill) { bill in
                EditBillView(dataService: dataService, bill: bill)
                    .onDisappear { Task { await loadBills() } }
            }
            .task {
                await loadBills()
            }
        }
    }
    
    private func loadBills() async {
        do {
            bills = try await dataService.fetchBills()
            isLoading = false
        } catch {
            print("Error loading bills: \(error)")
            isLoading = false
        }
    }
    
    private func deleteBills(at offsets: IndexSet, from sectionBills: [Bill]) {
        for index in offsets {
            let bill = sectionBills[index]
            Task {
                do {
                    try await dataService.deleteBill(bill)
                    await loadBills()
                } catch {
                    print("Error deleting bill: \(error)")
                }
            }
        }
    }
    
    private func checkOverdueBills() async {
        // Check for overdue bills and schedule reminders
        for bill in bills where bill.isOverdue && !bill.isPaid {
            NotificationsManager.shared.scheduleBillOverdueReminder(
                billId: bill.id,
                billName: bill.name,
                amount: bill.amount,
                dueDate: bill.dueDate
            )
        }
    }
}

struct BillRowView: View {
    let bill: Bill
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(bill.name)
                    .font(.headline)
                Text(bill.category)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text("Due: \(bill.dueDate, style: .date)")
                    .font(.caption)
                    .foregroundColor(bill.isOverdue ? .red : .secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text("$\(String(format: "%.2f", bill.amount))")
                    .font(.headline)
                    .foregroundColor(bill.isOverdue ? .red : .primary)
                
                if bill.isPaid {
                    Text("Paid")
                        .font(.caption)
                        .foregroundColor(.green)
                } else if bill.isOverdue {
                    Text("Overdue")
                        .font(.caption)
                        .foregroundColor(.red)
                } else {
                    Text("\(bill.daysUntilDue) days")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct AddBillView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    @State private var name: String = ""
    @State private var amount: String = ""
    @State private var category: String = "Utilities"
    @State private var dueDate: Date = Calendar.current.date(byAdding: .day, value: 7, to: Date()) ?? Date()
    @State private var frequency: Bill.Frequency = .monthly
    @State private var reminderDaysBefore: Int = 3
    @State private var notes: String = ""
    @State private var isSaving = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            Form {
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                TextField("Bill Name", text: $name)
                TextField("Amount", text: $amount)
                    .keyboardType(.decimalPad)
                TextField("Category", text: $category)
                DatePicker("Due Date", selection: $dueDate, displayedComponents: .date)
                Picker("Frequency", selection: $frequency) {
                    ForEach([Bill.Frequency.monthly, .quarterly, .yearly, .weekly, .biweekly], id: \.self) { freq in
                        Text(freq.displayName).tag(freq)
                    }
                }
                Stepper("Reminder: \(reminderDaysBefore) days before", value: $reminderDaysBefore, in: 0...7)
                TextField("Notes (optional)", text: $notes)
            }
            .navigationTitle("Add Bill")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveBill()
                    }
                    .disabled(isSaving || name.isEmpty || amount.isEmpty || category.isEmpty)
                }
            }
        }
    }
    
    private func saveBill() {
        guard let amountValue = Double(amount), amountValue > 0 else {
            errorMessage = "Please enter a valid amount"
            return
        }
        
        guard !name.isEmpty, !category.isEmpty else {
            errorMessage = "Please fill in all required fields"
            return
        }
        
        isSaving = true
        errorMessage = nil
        
        let bill = Bill(
            name: name,
            amount: amountValue,
            dueDate: dueDate,
            category: category,
            frequency: frequency,
            isPaid: false,
            notes: notes.isEmpty ? nil : notes,
            reminderDaysBefore: reminderDaysBefore
        )
        
        Task {
            do {
                try await dataService.saveBill(bill)
                await MainActor.run {
                    isSaving = false
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isSaving = false
                    errorMessage = "Failed to save: \(error.localizedDescription)"
                }
            }
        }
    }
}

struct EditBillView: View {
    @Environment(\.dismiss) var dismiss
    let dataService: DataService
    let bill: Bill
    @State private var name: String
    @State private var amount: String
    @State private var category: String
    @State private var dueDate: Date
    @State private var frequency: Bill.Frequency
    @State private var reminderDaysBefore: Int
    @State private var notes: String
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var markAsPaid = false
    
    init(dataService: DataService, bill: Bill) {
        self.dataService = dataService
        self.bill = bill
        _name = State(initialValue: bill.name)
        _amount = State(initialValue: String(format: "%.2f", bill.amount))
        _category = State(initialValue: bill.category)
        _dueDate = State(initialValue: bill.dueDate)
        _frequency = State(initialValue: bill.frequency)
        _reminderDaysBefore = State(initialValue: bill.reminderDaysBefore)
        _notes = State(initialValue: bill.notes ?? "")
    }
    
    var body: some View {
        NavigationView {
            Form {
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                TextField("Bill Name", text: $name)
                TextField("Amount", text: $amount)
                    .keyboardType(.decimalPad)
                TextField("Category", text: $category)
                DatePicker("Due Date", selection: $dueDate, displayedComponents: .date)
                Picker("Frequency", selection: $frequency) {
                    ForEach([Bill.Frequency.monthly, .quarterly, .yearly, .weekly, .biweekly], id: \.self) { freq in
                        Text(freq.displayName).tag(freq)
                    }
                }
                Stepper("Reminder: \(reminderDaysBefore) days before", value: $reminderDaysBefore, in: 0...7)
                TextField("Notes (optional)", text: $notes)
                
                if !bill.isPaid {
                    Section {
                        Button(action: {
                            markAsPaid = true
                            saveBill()
                        }) {
                            HStack {
                                Image(systemName: "checkmark.circle.fill")
                                Text("Mark as Paid")
                            }
                            .foregroundColor(.green)
                        }
                    }
                }
            }
            .navigationTitle("Edit Bill")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveBill()
                    }
                    .disabled(isSaving || name.isEmpty || amount.isEmpty || category.isEmpty)
                }
            }
        }
    }
    
    private func saveBill() {
        guard let amountValue = Double(amount), amountValue > 0 else {
            errorMessage = "Please enter a valid amount"
            return
        }
        
        guard !name.isEmpty, !category.isEmpty else {
            errorMessage = "Please fill in all required fields"
            return
        }
        
        isSaving = true
        errorMessage = nil
        
        Task {
            do {
                if markAsPaid {
                    try await dataService.markBillAsPaid(bill)
                } else {
                    var updatedBill = bill
                    updatedBill.name = name
                    updatedBill.amount = amountValue
                    updatedBill.category = category
                    updatedBill.dueDate = dueDate
                    updatedBill.frequency = frequency
                    updatedBill.reminderDaysBefore = reminderDaysBefore
                    updatedBill.notes = notes.isEmpty ? nil : notes
                    try await dataService.saveBill(updatedBill)
                }
                
                await MainActor.run {
                    isSaving = false
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isSaving = false
                    errorMessage = "Failed to save: \(error.localizedDescription)"
                }
            }
        }
    }
}

