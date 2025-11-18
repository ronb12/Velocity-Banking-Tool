//
//  OnboardingView.swift
//  BradleysFinanceHub
//
//  Onboarding tutorial for first-time users
//

import SwiftUI

struct OnboardingView: View {
    @Binding var isPresented: Bool
    @State private var currentPage = 0
    
    let pages = [
        OnboardingPage(
            title: "Welcome to Bradley's Finance Hub",
            description: "Take control of your finances with powerful tools and insights",
            icon: "house.fill",
            color: .blue
        ),
        OnboardingPage(
            title: "Track Your Money",
            description: "Record transactions, manage budgets, and track bills all in one place",
            icon: "dollarsign.circle.fill",
            color: .green
        ),
        OnboardingPage(
            title: "Set Financial Goals",
            description: "Create savings goals, track debts, and watch your net worth grow",
            icon: "target",
            color: .purple
        ),
        OnboardingPage(
            title: "Get Insights",
            description: "View charts, analyze spending patterns, and make better financial decisions",
            icon: "chart.bar.fill",
            color: .orange
        ),
        OnboardingPage(
            title: "Stay Organized",
            description: "Auto-categorization, bill reminders, and smart notifications keep you on track",
            icon: "bell.badge.fill",
            color: .red
        )
    ]
    
    var body: some View {
        ZStack {
            Color(.systemBackground)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Skip button
                HStack {
                    Spacer()
                    Button("Skip") {
                        isPresented = false
                    }
                    .padding()
                }
                
                // Page content
                TabView(selection: $currentPage) {
                    ForEach(0..<pages.count, id: \.self) { index in
                        OnboardingPageView(page: pages[index])
                            .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .always))
                
                // Navigation buttons
                HStack {
                    if currentPage > 0 {
                        Button("Previous") {
                            withAnimation {
                                currentPage -= 1
                            }
                        }
                    }
                    
                    Spacer()
                    
                    if currentPage < pages.count - 1 {
                        Button("Next") {
                            withAnimation {
                                currentPage += 1
                            }
                        }
                        .buttonStyle(.borderedProminent)
                    } else {
                        Button("Get Started") {
                            isPresented = false
                            UserDefaults.standard.set(true, forKey: "hasCompletedOnboarding")
                        }
                        .buttonStyle(.borderedProminent)
                    }
                }
                .padding()
            }
        }
    }
}

struct OnboardingPage {
    let title: String
    let description: String
    let icon: String
    let color: Color
}

struct OnboardingPageView: View {
    let page: OnboardingPage
    
    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            
            Image(systemName: page.icon)
                .font(.system(size: 80))
                .foregroundColor(page.color)
            
            Text(page.title)
                .font(.largeTitle)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
            
            Text(page.description)
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            
            Spacer()
        }
    }
}

