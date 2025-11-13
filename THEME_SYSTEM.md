# Global Theme System Documentation

## Overview
A comprehensive theme system has been implemented across the entire app, allowing users to switch between Light, Dark, Fun, and Auto (system preference) themes.

## Features

### 1. **Four Theme Options**
- **Light** - Default bright theme with blue accents
- **Dark** - Dark theme with light text and blue accents
- **Fun** - Playful theme with pink accents and warm backgrounds
- **Auto** - Automatically follows system preference (light/dark)

### 2. **Global Theme Manager**
- **File**: `utils/themeManager.js`
- Automatically initializes on page load
- Persists theme preference in localStorage
- Listens to system theme changes (for auto mode)
- Dispatches custom events for component updates

### 3. **CSS Variables System**
All themes use CSS custom properties (variables) for consistent theming:

```css
/* Color Variables */
--primary-color
--secondary-color
--accent-color
--danger-color
--warning-color
--success-color
--info-color

/* Background Variables */
--bg-primary
--bg-secondary
--bg-card
--bg-hover

/* Text Variables */
--text
--text-color
--text-muted
--text-inverse

/* Border & Shadow Variables */
--border-color
--shadow
--shadow-color
--shadow-hover
```

## Usage

### Adding Theme Support to a Page

1. **Include the theme manager script:**
```html
<script src="utils/themeManager.js"></script>
```

2. **Include theme.css:**
```html
<link rel="stylesheet" href="theme.css">
```

3. **Use CSS variables in your styles:**
```css
.my-component {
  background: var(--bg-card);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}
```

### Theme Toggle Button

Add the theme toggle button to any page:

```html
<button id="themeToggle" class="theme-toggle-btn" 
        title="Toggle Theme" 
        onclick="window.themeManager?.toggleTheme()">
  <span class="theme-icon">🎨</span>
  <span class="theme-text">Theme</span>
</button>
```

### Programmatic Theme Control

```javascript
// Toggle between themes
window.themeManager.toggleTheme();

// Set specific theme
window.themeManager.setTheme('dark');

// Get current theme
const current = window.themeManager.getCurrentTheme();

// Get available themes
const themes = window.themeManager.getAvailableThemes();

// Listen for theme changes
window.addEventListener('themechange', (e) => {
  console.log('Theme changed to:', e.detail.theme);
});
```

## Theme Colors

### Light Theme
- Primary: `#007bff` (Blue)
- Background: Light gradient
- Text: Dark gray
- Cards: White

### Dark Theme
- Primary: `#4da3ff` (Light Blue)
- Background: Dark gradient
- Text: Light gray/white
- Cards: Dark gray

### Fun Theme
- Primary: `#ff4b91` (Pink)
- Background: Warm cream/pink gradient
- Text: Dark gray
- Cards: Light pink

## Implementation Status

### ✅ Implemented
- Global theme manager (`utils/themeManager.js`)
- CSS variable system in `theme.css`
- Theme toggle button on main dashboard
- Theme persistence (localStorage)
- System preference detection (auto mode)
- Analytics tracking for theme changes

### 📋 Pages with Theme Support
- ✅ `index.html` - Main dashboard
- ✅ `challenge_library.html` - Has its own theme toggle
- ⚠️ Other pages - Need theme toggle button added

### 🔄 To Add Theme Support to Other Pages

1. Add theme manager script:
```html
<script src="utils/themeManager.js"></script>
```

2. Add theme toggle button (copy from `index.html`)

3. Replace hardcoded colors with CSS variables:
   - `#ffffff` → `var(--bg-card)`
   - `#000000` → `var(--text-color)`
   - `#007bff` → `var(--primary-color)`
   - etc.

## Benefits

1. **User Preference** - Users can choose their preferred theme
2. **Accessibility** - Dark mode reduces eye strain
3. **Consistency** - All pages use the same theme system
4. **Persistence** - Theme choice is saved across sessions
5. **System Integration** - Auto mode follows OS preference
6. **Analytics** - Theme usage is tracked

## Future Enhancements

- [ ] Add more theme options (e.g., High Contrast, Ocean, Forest)
- [ ] Per-page theme preferences
- [ ] Theme preview before applying
- [ ] Custom theme builder
- [ ] Theme scheduling (auto dark mode at night)

