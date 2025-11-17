//
//  AppTheme.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

class ThemeManager: ObservableObject {
    @Published var currentTheme: AppTheme = .default
    
    var accentColor: Color {
        currentTheme.accentColor
    }
    
    var backgroundColor: Color {
        currentTheme.backgroundColor
    }
    
    var textColor: Color {
        currentTheme.textColor
    }
    
    func setTheme(_ theme: AppTheme) {
        currentTheme = theme
        UserDefaults.standard.set(theme.rawValue, forKey: "selectedTheme")
    }
    
    init() {
        if let savedTheme = UserDefaults.standard.string(forKey: "selectedTheme"),
           let theme = AppTheme(rawValue: savedTheme) {
            currentTheme = theme
        }
    }
}

enum AppTheme: String, CaseIterable {
    case `default` = "default"
    case blue = "blue"
    case green = "green"
    case purple = "purple"
    case orange = "orange"
    case red = "red"
    case teal = "teal"
    case pink = "pink"
    
    var accentColor: Color {
        switch self {
        case .default: return .blue
        case .blue: return .blue
        case .green: return .green
        case .purple: return .purple
        case .orange: return .orange
        case .red: return .red
        case .teal: return .teal
        case .pink: return .pink
        }
    }
    
    var backgroundColor: Color {
        Color(.systemBackground)
    }
    
    var textColor: Color {
        Color(.label)
    }
    
    var displayName: String {
        rawValue.capitalized
    }
}

