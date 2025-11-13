# Component Documentation
## Bradley's Finance Hub

## Component Architecture

All components follow a consistent pattern:
- ES6 class-based
- Singleton pattern for global components
- Event-driven architecture
- State management integration

## Core Components

### ProfileModal

**Location:** `src/scripts/components/ProfileModal.js`

**Purpose:** Manages the user profile modal display and interactions.

**Methods:**
- `init()` - Initialize component
- `open()` - Open modal
- `close()` - Close modal
- `isOpen()` - Check if open
- `updateProfileStats()` - Update profile statistics

**Usage:**
```javascript
import { profileModal } from './components/ProfileModal.js';

profileModal.open();
```

### ThemeSelector

**Location:** `src/scripts/components/ThemeSelector.js`

**Purpose:** Manages theme selection dropdown.

**Methods:**
- `init()` - Initialize component
- `selectTheme(themeId)` - Select a theme
- `updateButton()` - Update button display
- `toggle()` - Toggle dropdown
- `open()` - Open dropdown
- `close()` - Close dropdown

**Usage:**
```javascript
import { themeSelector } from './components/ThemeSelector.js';

themeSelector.init();
themeSelector.selectTheme('blue');
```

## Page Controllers

### Dashboard

**Location:** `src/scripts/pages/Dashboard.js`

**Purpose:** Main dashboard page controller.

**Methods:**
- `init()` - Initialize dashboard
- `loadDashboardData()` - Load all dashboard data
- `updateStat(statName, value)` - Update statistic

**Usage:**
```javascript
import Dashboard from './pages/Dashboard.js';

const dashboard = new Dashboard();
await dashboard.init();
```

## State Management

### StateManager

**Location:** `src/scripts/core/StateManager.js`

**Purpose:** Centralized state management.

**State Structure:**
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

**Usage:**
```javascript
import { stateManager } from './core/StateManager.js';

// Subscribe to state changes
stateManager.subscribe((newState, prevState) => {
  console.log('State changed:', newState);
});

// Update state
stateManager.setUser({ id: '123', email: 'user@example.com' });
```

## Component Lifecycle

1. **Initialization** - Component is created
2. **Mounting** - Component is added to DOM
3. **Updating** - Component state changes
4. **Unmounting** - Component is removed from DOM

## Best Practices

1. **Single Responsibility** - Each component has one purpose
2. **Composition** - Build complex components from simple ones
3. **Props Down, Events Up** - Data flows down, events flow up
4. **State Management** - Use StateManager for shared state
5. **Error Handling** - Always handle errors gracefully

---

*Last Updated: 2025-01-13*

