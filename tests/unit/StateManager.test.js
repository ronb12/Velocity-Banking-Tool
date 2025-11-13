/**
 * StateManager Unit Tests
 */

import { StateManager } from '../../src/scripts/core/StateManager.js';

describe('StateManager', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  test('should initialize with default state', () => {
    const state = stateManager.getState();
    expect(state).toHaveProperty('user');
    expect(state).toHaveProperty('financialData');
    expect(state).toHaveProperty('ui');
  });

  test('should update state correctly', () => {
    const updates = { user: { id: '123', email: 'test@example.com' } };
    stateManager.setState(updates);
    const state = stateManager.getState();
    expect(state.user).toEqual(updates.user);
  });

  test('should notify listeners on state change', () => {
    let callCount = 0;
    let lastNewState = null;
    let lastPrevState = null;
    
    const listener = (newState, prevState) => {
      callCount++;
      lastNewState = newState;
      lastPrevState = prevState;
    };
    
    stateManager.subscribe(listener);
    
    stateManager.setState({ user: { id: '123' } });
    
    expect(callCount).toBe(1);
    expect(lastNewState).toHaveProperty('user');
    expect(lastNewState.user).toEqual({ id: '123' });
    expect(lastPrevState).toBeDefined();
  });

  test('should allow unsubscribing from state changes', () => {
    let callCount = 0;
    const listener = () => {
      callCount++;
    };
    
    const unsubscribe = stateManager.subscribe(listener);
    
    stateManager.setState({ user: { id: '123' } });
    expect(callCount).toBe(1);
    
    unsubscribe();
    stateManager.setState({ user: { id: '456' } });
    expect(callCount).toBe(1); // Should not be called again
  });

  test('should set user correctly', () => {
    const user = { id: '123', email: 'test@example.com' };
    stateManager.setUser(user);
    const state = stateManager.getState();
    expect(state.user).toEqual(user);
  });

  test('should clear user correctly', () => {
    stateManager.setUser({ id: '123', email: 'test@example.com' });
    stateManager.clearUser();
    const state = stateManager.getState();
    expect(state.user).toBeNull();
  });

  test('should set debts correctly', () => {
    const debts = [{ id: '1', name: 'Credit Card', amount: 1000 }];
    stateManager.setDebts(debts);
    const state = stateManager.getState();
    expect(state.financialData.debts).toEqual(debts);
  });

  test('should set theme correctly', () => {
    stateManager.setTheme('blue');
    const state = stateManager.getState();
    expect(state.ui.theme).toBe('blue');
  });

  test('should add notification correctly', () => {
    const notification = { id: '1', message: 'Test notification', type: 'info' };
    stateManager.addNotification(notification);
    const state = stateManager.getState();
    expect(state.ui.notifications).toContainEqual(notification);
  });

  test('should remove notification correctly', () => {
    const notification = { id: '1', message: 'Test', type: 'info' };
    stateManager.addNotification(notification);
    stateManager.removeNotification('1');
    const state = stateManager.getState();
    expect(state.ui.notifications).not.toContainEqual(notification);
  });
});

