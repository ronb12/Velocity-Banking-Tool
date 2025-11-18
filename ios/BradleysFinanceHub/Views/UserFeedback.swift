//
//  UserFeedback.swift
//  BradleysFinanceHub
//
//  User feedback utilities - Toasts, Haptics, Progress indicators
//

import SwiftUI
import UIKit

// MARK: - Toast Message

struct ToastModifier: ViewModifier {
    @Binding var message: String?
    @State private var isShowing = false
    
    func body(content: Content) -> some View {
        ZStack {
            content
            
            if isShowing, let message = message {
                VStack {
                    Spacer()
                    HStack {
                        Text(message)
                            .font(.subheadline)
                            .foregroundColor(.white)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                            .background(Color.black.opacity(0.8))
                            .cornerRadius(10)
                    }
                    .padding(.bottom, 50)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .animation(.spring(response: 0.3), value: isShowing)
            }
        }
        .onChange(of: message) { oldValue, newValue in
            if newValue != nil {
                isShowing = true
                // Auto-dismiss after 2 seconds
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                    isShowing = false
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        self.message = nil
                    }
                }
            }
        }
    }
}

extension View {
    func toast(message: Binding<String?>) -> some View {
        modifier(ToastModifier(message: message))
    }
}

// MARK: - Haptic Feedback

struct HapticFeedback {
    static func success() {
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
    }
    
    static func error() {
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.error)
    }
    
    static func warning() {
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.warning)
    }
    
    static func light() {
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
    }
    
    static func medium() {
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
    }
    
    static func heavy() {
        let generator = UIImpactFeedbackGenerator(style: .heavy)
        generator.impactOccurred()
    }
}

