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
		print("BradleysFinanceHubApp: Initializing...")
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
                    .task {
                        // Request notification permission on app launch
                        _ = await NotificationsManager.shared.requestAuthorization()
                    }
            } else {
                VStack(spacing: 16) {
                    ProgressView()
                        .scaleEffect(1.5)
                    Text("Initializing...")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .task {
                    await initializeCoreData()
                }
            }
        }
    }
	
	private func initializeCoreData() async {
		print("BradleysFinanceHubApp: Starting Core Data initialization...")
		
		var stack: CoreDataStack
		
		// Try CloudKit first
		stack = CoreDataStack(useCloudKit: true)
		
		// Wait for store to actually load with timeout
		var storeLoaded = false
		do {
			// Use timeout to prevent infinite waiting (5 seconds)
			try await withTimeout(seconds: 5) {
				try await stack.waitForStoreToLoad()
			}
			storeLoaded = !stack.container.persistentStoreCoordinator.persistentStores.isEmpty
			if storeLoaded {
				print("✅ Core Data store loaded successfully with CloudKit")
				print("   Store count: \(stack.container.persistentStoreCoordinator.persistentStores.count)")
			}
		} catch {
			print("⚠️ Core Data store did not load with CloudKit: \(error.localizedDescription)")
			storeLoaded = !stack.container.persistentStoreCoordinator.persistentStores.isEmpty
		}
		
		// If CloudKit failed and no stores loaded, try local-only
		if !storeLoaded {
			print("🔄 Trying local-only Core Data (no CloudKit)...")
			stack = CoreDataStack(useCloudKit: false)
			
			do {
				try await withTimeout(seconds: 3) {
					try await stack.waitForStoreToLoad()
				}
				storeLoaded = !stack.container.persistentStoreCoordinator.persistentStores.isEmpty
				if storeLoaded {
					print("✅ Core Data store loaded successfully (local-only)")
				}
			} catch {
				print("⚠️ Local Core Data also failed: \(error.localizedDescription)")
				// Proceed anyway - store will be created on first use
			}
		}
		
		// Always proceed - don't block app launch
		// Update state on main thread
		await MainActor.run {
			self.coreDataStack = stack
			self.isCoreDataReady = true
			print("BradleysFinanceHubApp: Core Data ready, showing ContentView")
			print("   Stores loaded: \(stack.container.persistentStoreCoordinator.persistentStores.count)")
			
			// Verify database
			_ = stack.verifyDatabase()
		}
	}
	
	// Helper to add timeout to async operations
	private func withTimeout<T>(seconds: Double, operation: @escaping () async throws -> T) async throws -> T {
		return try await withThrowingTaskGroup(of: T.self) { group in
			// Add the actual operation
			group.addTask {
				return try await operation()
			}
			
			// Add timeout task
			group.addTask {
				try await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
				throw NSError(domain: "Timeout", code: -1, userInfo: [NSLocalizedDescriptionKey: "Operation timed out after \(seconds) seconds"])
			}
			
			// Return first completed task and cancel the other
			let result = try await group.next()!
			group.cancelAll()
			return result
		}
	}
}

