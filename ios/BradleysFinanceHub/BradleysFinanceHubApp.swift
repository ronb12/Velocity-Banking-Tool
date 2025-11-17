//
//  BradleysFinanceHubApp.swift
//  BradleysFinanceHub
//
//  Created on 2025-01-15.
//

import SwiftUI

@main
struct BradleysFinanceHubApp: App {
    @StateObject private var authService = AuthenticationService()
    @StateObject private var themeManager = ThemeManager()
	@State private var coreDataStack: CoreDataStack?
	@State private var isCoreDataReady = false
    
	init() {
		// Initialize Core Data immediately in init
		// This ensures it's ready before any views try to access it
		// Try CloudKit first, but don't fail if it's not available
		let stack = CoreDataStack(useCloudKit: true)
		coreDataStack = stack
		// Wait a moment for Core Data to initialize
		// The loadPersistentStores callback is async, but we'll proceed anyway
		// Set ready after a short delay to allow store to load
		DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
			self.isCoreDataReady = true
		}
		print("Core Data stack created")
	}
    
    var body: some Scene {
        WindowGroup {
            if let coreDataStack = coreDataStack, isCoreDataReady {
                ContentView()
                    .environmentObject(authService)
                    .environmentObject(themeManager)
                    .environment(\.managedObjectContext, coreDataStack.viewContext)
                    .tint(themeManager.accentColor)
                    .onReceive(NotificationCenter.default.publisher(for: UIApplication.willEnterForegroundNotification)) { _ in
                        // Require biometric auth when app comes to foreground
                        if authService.biometricAuthService.isBiometricEnabled && authService.isAuthenticated {
                            Task {
                                authService.isAuthenticated = false
                                authService.requiresBiometricAuth = true
                                await authService.authenticateWithBiometric()
                            }
                        }
                    }
            } else {
                // Show loading screen while Core Data initializes
                ProgressView("Initializing...")
            }
        }
    }
}

