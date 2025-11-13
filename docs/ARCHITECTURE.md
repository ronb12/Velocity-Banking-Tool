# Architecture Documentation
## Bradley's Finance Hub

## Overview

Bradley's Finance Hub is a Progressive Web App (PWA) built with modern web technologies, following a component-based architecture with centralized state management.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │  Pages   │  │Components│  │  Styles  │            │
│  └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  Application Layer                       │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │State Manager │  │  Controllers │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │  Auth    │  │  Sync    │  │  Utils   │            │
│  └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│  ┌──────────────────────────────────────┐              │
│  │         Firebase Services             │              │
│  │  ┌────────┐  ┌────────┐  ┌────────┐│              │
│  │  │Auth    │  │Firestore│  │Storage ││              │
│  │  └────────┘  └────────┘  └────────┘│              │
│  └──────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

## Component Architecture

### Pages
- **Location:** `src/pages/`
- **Purpose:** Top-level page components
- **Structure:** One controller per page

### Components
- **Location:** `src/scripts/components/`
- **Purpose:** Reusable UI components
- **Examples:** ProfileModal, ThemeSelector, NotificationSystem

### Core Services
- **Location:** `src/scripts/core/`
- **Purpose:** Core application services
- **Examples:** StateManager, AuthService, SyncService

### Utilities
- **Location:** `utils/`
- **Purpose:** Shared utility functions
- **Examples:** errorHandler, validation, analytics

## Data Flow

1. **User Action** → Component
2. **Component** → State Manager (update state)
3. **State Manager** → Service Layer (persist data)
4. **Service Layer** → Firebase (save to database)
5. **Firebase** → Service Layer (real-time updates)
6. **Service Layer** → State Manager (update state)
7. **State Manager** → Components (re-render)

## State Management

### State Structure
```javascript
{
  user: {
    id: string,
    email: string,
    profile: object
  },
  financialData: {
    debts: array,
    savings: array,
    budgets: array,
    netWorth: number
  },
  ui: {
    theme: string,
    sidebarOpen: boolean,
    notifications: array
  }
}
```

### State Updates
- Components subscribe to state changes
- State updates trigger re-renders
- State is persisted to Firebase

## Build System

### Vite Configuration
- **Entry Points:** Multiple HTML files
- **Code Splitting:** Route-based and vendor chunks
- **Optimization:** Minification, tree-shaking
- **PWA:** Service worker generation

### Build Process
1. **Development:** Vite dev server with HMR
2. **Production:** Vite build with optimizations
3. **Deployment:** Firebase Hosting

## Security Architecture

### Authentication Flow
1. User logs in via Firebase Auth
2. Auth token stored securely
3. Firestore rules validate user access
4. Session management with timeout

### Data Security
- User data isolated by UID
- Firestore security rules enforce access
- Client-side validation + server-side rules
- Input sanitization

## Performance Optimizations

### Code Splitting
- Route-based splitting
- Vendor chunk separation
- Lazy loading of components

### Caching Strategy
- Service worker caching
- Static asset caching
- API response caching

### Asset Optimization
- Image optimization
- CSS/JS minification
- Tree shaking
- Dead code elimination

## Testing Architecture

### Test Types
- **Unit Tests:** Individual functions/components
- **Integration Tests:** Component interactions
- **E2E Tests:** Full user workflows

### Test Structure
```
tests/
├── unit/          # Unit tests
├── integration/   # Integration tests
└── e2e/           # End-to-end tests
```

## Deployment Architecture

### Environments
- **Development:** Local with Firebase emulator
- **Staging:** Staging Firebase project
- **Production:** Production Firebase project

### Deployment Process
1. Build with Vite
2. Optimize assets
3. Deploy to Firebase Hosting
4. Update service worker
5. Cache invalidation

---

*Last Updated: 2025-01-13*

