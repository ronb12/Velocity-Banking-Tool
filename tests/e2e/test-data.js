// Test user credentials
const testUsers = [
    {
        email: 'test1@example.com',
        password: 'Test123!',
        name: 'Test User 1'
    },
    {
        email: 'test2@example.com',
        password: 'Test456!',
        name: 'Test User 2'
    }
];

// Test cases
const testCases = [
    {
        name: 'Valid Login',
        email: 'test1@example.com',
        password: 'Test123!',
        expectedResult: true
    },
    {
        name: 'Invalid Password',
        email: 'test1@example.com',
        password: 'WrongPassword123!',
        expectedResult: false
    },
    {
        name: 'Invalid Email',
        email: 'nonexistent@example.com',
        password: 'Test123!',
        expectedResult: false
    }
];

export { testUsers, testCases }; 