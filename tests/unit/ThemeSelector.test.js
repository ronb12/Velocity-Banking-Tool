/**
 * ThemeSelector Unit Tests
 */

import { ThemeSelector } from '../../src/scripts/components/ThemeSelector.js';

describe('ThemeSelector', () => {
  let themeSelector;
  let mockThemeManager;

  beforeEach(() => {
    // Track calls for setTheme
    let setThemeCalled = false;
    let setThemeArg = null;
    
    // Mock themeManager
    mockThemeManager = {
      getAvailableThemes: () => ['blue', 'pink', 'green'],
      getCurrentTheme: () => 'blue',
      getThemeInfo: (themeId) => ({
        blue: { name: 'Blue', icon: '🔵', color: '#007bff' },
        pink: { name: 'Pink', icon: '🌸', color: '#ff4b91' },
        green: { name: 'Green', icon: '🟢', color: '#28a745' },
      }[themeId]),
      getThemeColor: (themeId) => ({
        blue: '#007bff',
        pink: '#ff4b91',
        green: '#28a745',
      }[themeId]),
      setTheme: (themeId) => {
        setThemeCalled = true;
        setThemeArg = themeId;
      },
      // Helper to check if setTheme was called
      _setThemeCalled: () => setThemeCalled,
      _setThemeArg: () => setThemeArg,
      _reset: () => {
        setThemeCalled = false;
        setThemeArg = null;
      }
    };

    window.themeManager = mockThemeManager;

    // Create DOM elements
    document.body.innerHTML = `
      <button id="themeDropdownButton">
        <span id="themeDropdownSwatch"></span>
        <span id="themeDropdownText">Blue</span>
      </button>
      <div id="themeDropdownMenu"></div>
    `;

    themeSelector = new ThemeSelector();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete window.themeManager;
  });

  test('should initialize correctly', () => {
    themeSelector.init();
    expect(themeSelector.isInitialized).toBe(true);
  });

  test('should populate menu with themes', () => {
    themeSelector.init();
    const menu = document.getElementById('themeDropdownMenu');
    expect(menu.children.length).toBe(3);
  });

  test('should update button with current theme', () => {
    themeSelector.init();
    const swatch = document.getElementById('themeDropdownSwatch');
    const text = document.getElementById('themeDropdownText');
    expect(swatch.style.background).toBe('rgb(0, 123, 255)');
    expect(text.textContent).toBe('Blue');
  });

  test('should select theme correctly', () => {
    mockThemeManager._reset();
    themeSelector.init();
    themeSelector.selectTheme('pink');
    expect(mockThemeManager._setThemeCalled()).toBe(true);
    expect(mockThemeManager._setThemeArg()).toBe('pink');
  });

  test('should toggle dropdown', () => {
    themeSelector.init();
    expect(themeSelector.isOpen()).toBe(false);
    themeSelector.toggle();
    expect(themeSelector.isOpen()).toBe(true);
    themeSelector.toggle();
    expect(themeSelector.isOpen()).toBe(false);
  });
});

