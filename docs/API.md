# API Documentation
## Bradley's Finance Hub

## Core APIs

### StateManager

#### `getState()`
Returns a copy of the current application state.

**Returns:** `Object` - Current state

#### `setState(updates)`
Updates the application state and notifies all listeners.

**Parameters:**
- `updates` (Object) - State updates to apply

**Example:**
```javascript
stateManager.setState({ user: { id: '123', email: 'user@example.com' } });
```

#### `subscribe(listener)`
Subscribe to state changes.

**Parameters:**
- `listener` (Function) - Callback function `(newState, prevState) => void`

**Returns:** `Function` - Unsubscribe function

**Example:**
```javascript
const unsubscribe = stateManager.subscribe((newState, prevState) => {
  console.log('State changed:', newState);
});
```

### ProfileModal

#### `init()`
Initialize the profile modal component.

#### `open()`
Open the profile modal.

#### `close()`
Close the profile modal.

#### `isOpen()`
Check if the modal is currently open.

**Returns:** `Boolean`

### ThemeSelector

#### `init()`
Initialize the theme selector component.

#### `selectTheme(themeId)`
Select a theme.

**Parameters:**
- `themeId` (String) - Theme identifier ('blue', 'pink', 'green', etc.)

#### `updateButton()`
Update the dropdown button with current theme.

#### `toggle()`
Toggle the dropdown menu.

#### `open()`
Open the dropdown menu.

#### `close()`
Close the dropdown menu.

### Dashboard

#### `init()`
Initialize the dashboard page.

#### `loadDashboardData()`
Load all dashboard data from Firebase.

#### `updateStat(statName, value)`
Update a dashboard statistic.

**Parameters:**
- `statName` (String) - Statistic name
- `value` (String|Number) - Statistic value

## Utility APIs

### ThemeManager

#### `getAvailableThemes()`
Get list of available themes.

**Returns:** `Array<String>`

#### `getCurrentTheme()`
Get the currently active theme.

**Returns:** `String`

#### `setTheme(themeId)`
Set the active theme.

**Parameters:**
- `themeId` (String) - Theme identifier

#### `getThemeInfo(themeId)`
Get theme information.

**Parameters:**
- `themeId` (String) - Theme identifier

**Returns:** `Object` - Theme info with name, icon, color

#### `getThemeColor(themeId)`
Get theme primary color.

**Parameters:**
- `themeId` (String) - Theme identifier

**Returns:** `String` - Hex color code

### ErrorHandler

#### `showError(message)`
Display an error message.

**Parameters:**
- `message` (String) - Error message

#### `showWarning(message)`
Display a warning message.

**Parameters:**
- `message` (String) - Warning message

#### `showSuccess(message)`
Display a success message.

**Parameters:**
- `message` (String) - Success message

#### `handleFirebaseError(error)`
Handle Firebase errors.

**Parameters:**
- `error` (Error) - Firebase error object

### Analytics

#### `trackEvent(eventName, properties)`
Track an analytics event.

**Parameters:**
- `eventName` (String) - Event name
- `properties` (Object) - Event properties

**Example:**
```javascript
analytics.trackEvent('theme_changed', { theme: 'blue' });
```

## Firebase APIs

### Authentication

#### `login(email, password)`
Log in a user.

**Parameters:**
- `email` (String) - User email
- `password` (String) - User password

**Returns:** `Promise<User>`

#### `register(email, password, displayName)`
Register a new user.

**Parameters:**
- `email` (String) - User email
- `password` (String) - User password
- `displayName` (String) - User display name

**Returns:** `Promise<User>`

#### `logout()`
Log out the current user.

**Returns:** `Promise<void>`

### Firestore

#### `getUserData(userId)`
Get user data from Firestore.

**Parameters:**
- `userId` (String) - User ID

**Returns:** `Promise<Object>`

#### `saveUserData(userId, data)`
Save user data to Firestore.

**Parameters:**
- `userId` (String) - User ID
- `data` (Object) - User data

**Returns:** `Promise<void>`

---

*Last Updated: 2025-01-13*

