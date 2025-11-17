//
//  NotificationsManager.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import Foundation
import UserNotifications

class NotificationsManager {
    static let shared = NotificationsManager()
    
    private init() {}
    
    func requestAuthorization() async -> Bool {
        do {
            return try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge])
        } catch {
            print("Failed to request notification authorization: \(error)")
            return false
        }
    }
    
    func scheduleBudgetWarningNotification(budgetId: String, category: String, spent: Double, budgeted: Double, thresholds: [Double]) {
        let percentage = (spent / budgeted) * 100
        
        for threshold in thresholds {
            if percentage >= threshold {
                let content = UNMutableNotificationContent()
                content.title = "Budget Alert"
                content.body = "You've spent \(Int(percentage))% of your \(category) budget"
                content.sound = .default
                content.badge = 1
                
                let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
                let request = UNNotificationRequest(identifier: "budget-\(budgetId)-\(Int(threshold))", content: content, trigger: trigger)
                
                UNUserNotificationCenter.current().add(request)
                break
            }
        }
    }
    
    func scheduleDebtPaymentReminder(debtId: String, debtName: String, dueDate: Date) {
        let content = UNMutableNotificationContent()
        content.title = "Debt Payment Due"
        content.body = "Payment for \(debtName) is due soon"
        content.sound = .default
        
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month, .day], from: dueDate)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        let request = UNNotificationRequest(identifier: "debt-\(debtId)", content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request)
    }
    
    func cancelNotification(identifier: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [identifier])
    }
}

