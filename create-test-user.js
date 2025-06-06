import { auth } from './firebase-config.js';

async function createTestUser() {
  const email = 'test1@example.com';
  const password = 'Test123!';
  try {
    await auth.createUserWithEmailAndPassword(email, password);
    console.log('Test user created successfully.');
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Test user already exists.');
    } else {
      console.error('Error creating test user:', error.message);
    }
  }
}

createTestUser(); 