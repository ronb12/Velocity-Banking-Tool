# Bradley's Finance Hub

A comprehensive, AI-powered personal finance dashboard built with Firebase and modern web technologies. This advanced toolkit helps users master their money using velocity banking principles, debt payoff automation, budgeting, and net worth tracking — all in one intuitive, accessible, and secure Progressive Web App (PWA).

## 🌟 Features

### Core Features
- **Debt Tracking & Management** - Track multiple debts with automated payoff strategies
- **Savings Goals** - Set and track savings goals with visual progress
- **Budget Management** - Create and manage budgets with spending tracking
- **Net Worth Calculator** - Comprehensive net worth tracking
- **Credit Score Estimator** - Estimate your credit score
- **Velocity Banking Calculator** - Optimize debt payoff strategies
- **Challenge Library** - Savings challenges with PDF guides
- **Activity Feed** - Master activity log for all financial actions
- **Notifications** - Real-time notifications for important events

### Technical Features
- **Progressive Web App (PWA)** - Installable, offline-capable
- **8 Color Themes** - Customizable theme system
- **Responsive Design** - Mobile-first, works on all devices
- **Real-time Sync** - Firebase Firestore for data synchronization
- **Offline Support** - Service worker for offline functionality
- **Analytics** - Built-in analytics tracking
- **Accessibility** - WCAG compliant

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ronb12/Velocity-Banking-Tool.git
   cd "Bradley's Finance Hub"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a `.env` file in the root directory
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Navigate to `http://localhost:3000`

## 📁 Project Structure

```
Bradley's Finance Hub/
├── src/
│   ├── pages/          # Page components
│   │   ├── auth/       # Authentication pages
│   │   ├── debt/       # Debt tracking pages
│   │   ├── savings/    # Savings pages
│   │   ├── calculators/# Calculator pages
│   │   └── other/      # Other pages
│   ├── styles/         # CSS files
│   ├── scripts/        # JavaScript modules
│   │   ├── core/       # Core functionality
│   │   ├── components/ # Reusable components
│   │   └── pages/      # Page controllers
│   └── components/     # HTML components
├── public/             # Static assets
│   ├── icons/          # App icons
│   ├── pdfs/           # PDF resources
│   └── assets/         # Other assets
├── tests/              # Test files
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/            # End-to-end tests
├── utils/              # Utility modules
├── docs/               # Documentation
├── firebase.json       # Firebase configuration
├── vite.config.js      # Vite build configuration
└── package.json        # Dependencies
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run deploy` - Build and deploy to Firebase

### Code Style

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **JavaScript ES6+** - Modern JavaScript
- **CSS Variables** - Theme system
- **Kebab-case** - File naming convention

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Test Structure

- **Unit Tests** - Test individual functions and components
- **Integration Tests** - Test component interactions
- **E2E Tests** - Test full user workflows with Puppeteer

## 📦 Building for Production

```bash
# Build the app
npm run build

# Preview the build
npm run preview

# Deploy to Firebase
npm run deploy
```

The build output will be in the `dist/` directory, optimized and minified for production.

## 🔒 Security

### Security Features
- Firebase Authentication
- Firestore Security Rules
- Input validation
- XSS protection
- CSRF protection
- Secure session management

### Environment Variables
Never commit sensitive data. Use `.env` files for:
- Firebase configuration
- API keys
- Secret keys

## 🚀 Deployment

### Firebase Hosting

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Deploy**
   ```bash
   firebase deploy --only hosting
   ```

### Environment Setup

- Production: Uses production Firebase project
- Staging: Uses staging Firebase project
- Development: Uses local Firebase emulator

## 📚 Documentation

- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Component Documentation](./docs/COMPONENTS.md)
- [Theme System](./THEME_SYSTEM.md)
- [Code Review Analysis](./CODE_REVIEW_ANALYSIS.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the code style (ESLint + Prettier)
- Write tests for new features
- Update documentation
- Follow semantic versioning

## 📄 License

MIT License - see LICENSE file for details

## 👤 Author

Bradley's Finance Hub

## 🙏 Acknowledgments

- Firebase for backend services
- Vite for build tooling
- All contributors and testers

---

**Version:** 2.1.0  
**Last Updated:** 2025-01-13
