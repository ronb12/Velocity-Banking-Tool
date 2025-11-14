import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import legacy from '@vitejs/plugin-legacy';
import { resolve, dirname } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'src/pages/auth/login.html'),
        register: resolve(__dirname, 'src/pages/auth/register.html'),
        reset: resolve(__dirname, 'src/pages/auth/reset.html'),
        // Debt pages
        debtTracker: resolve(__dirname, 'src/pages/debt/Debt_Tracker.html'),
        debtCrusher: resolve(__dirname, 'src/pages/debt/debt-crusher.html'),
        // Savings pages
        savingsTracker: resolve(__dirname, 'src/pages/savings/savings_goal_tracker.html'),
        challengeLibrary: resolve(__dirname, 'src/pages/savings/challenge_library.html'),
        // Calculator pages
        velocityCalculator: resolve(__dirname, 'src/pages/calculators/Velocity_Calculator.html'),
        calculator1099: resolve(__dirname, 'src/pages/calculators/1099_calculator.html'),
        creditScore: resolve(__dirname, 'src/pages/calculators/Credit_Score_Estimator.html'),
        // Other pages
        budget: resolve(__dirname, 'src/pages/other/budget.html'),
        income: resolve(__dirname, 'src/pages/other/income.html'),
        calendar: resolve(__dirname, 'src/pages/other/calendar.html'),
        netWorth: resolve(__dirname, 'src/pages/other/net_worth_tracker.html'),
        activityFeed: resolve(__dirname, 'src/pages/other/activity_feed.html'),
        notifications: resolve(__dirname, 'src/pages/other/notifications.html'),
        mobileTracker: resolve(__dirname, 'src/pages/other/Mobile_Tracker.html'),
      },
      output: {
        manualChunks: {
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-utils': [
            './utils/themeManager.js',
            './utils/errorHandler.js',
            './utils/analytics.js',
          ],
          'components': [
            './src/scripts/components/ProfileModal.js',
            './src/scripts/components/ThemeSelector.js',
          ],
          'core': [
            './src/scripts/core/StateManager.js',
            './src/scripts/core/config.js',
          ],
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@utils': resolve(__dirname, 'utils'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@components': resolve(__dirname, 'src/scripts/components'),
      '@core': resolve(__dirname, 'src/scripts/core'),
    },
  },
  plugins: [
    // Plugin to copy non-module script files to dist
    {
      name: 'copy-utils-scripts',
      writeBundle() {
        const filesToCopy = [
          { src: 'service-worker.js', dest: 'service-worker.js' },
          { src: 'config.js', dest: 'config.js' },
          { src: 'icons/icon-192.png', dest: 'icons/icon-192.png' },
          { src: 'icons/icon-512.png', dest: 'icons/icon-512.png' },
          { src: 'utils/validation.js', dest: 'utils/validation.js' },
          { src: 'utils/errorHandler.js', dest: 'utils/errorHandler.js' },
          { src: 'utils/performance.js', dest: 'utils/performance.js' },
          { src: 'utils/lazyLoader.js', dest: 'utils/lazyLoader.js' },
          { src: 'utils/mobileOptimizer.js', dest: 'utils/mobileOptimizer.js' },
          { src: 'utils/accessibility.js', dest: 'utils/accessibility.js' },
          { src: 'utils/analytics.js', dest: 'utils/analytics.js' },
          { src: 'utils/financialInsights.js', dest: 'utils/financialInsights.js' },
          { src: 'utils/themeManager.js', dest: 'utils/themeManager.js' },
          { src: 'app-updater.js', dest: 'app-updater.js' },
        ];
        
        const distDir = resolve(__dirname, 'dist');
        
        filesToCopy.forEach(({ src, dest }) => {
          const srcPath = resolve(__dirname, src);
          const destPath = resolve(distDir, dest);
          const destDirPath = dirname(destPath);
          
          if (existsSync(srcPath)) {
            if (!existsSync(destDirPath)) {
              mkdirSync(destDirPath, { recursive: true });
            }
            copyFileSync(srcPath, destPath);
            console.log(`✓ Copied ${src} to ${dest}`);
          } else {
            console.warn(`⚠ Warning: ${src} not found, skipping copy`);
          }
        });
      },
    },
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: "Bradley's Finance Hub",
        short_name: "Finance Hub",
        description: "Track and manage your debts, spending, and finances easily on mobile.",
        theme_color: "#007bff",
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      // Disable PWA plugin in development or when DISABLE_PWA is set
      // This prevents service worker generation issues with paths containing spaces
      // Temporarily disabled in production due to path space issues
      disable: process.env.NODE_ENV === 'development' || 
               process.env.DISABLE_PWA === 'true' || 
               process.env.DISABLE_PWA === true ||
               true, // Temporarily disabled until path issue is resolved
      // Fix path issues with spaces in directory names
      swDest: 'sw.js',
      mode: 'production',
    }),
  ],
  server: {
    port: 3000,
    open: true,
    fs: {
      allow: ['..'],
    },
    // Exclude utility scripts from Vite transformation in dev mode
    // This prevents import statement injection into non-module scripts
    middlewareMode: false,
  },
  // Configure which files Vite should pre-bundle
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
    // Exclude utility scripts from pre-bundling to prevent import injection
    exclude: [
      './utils/validation.js',
      './utils/errorHandler.js',
      './utils/performance.js',
      './utils/lazyLoader.js',
      './utils/mobileOptimizer.js',
      './utils/accessibility.js',
      './utils/analytics.js',
      './utils/financialInsights.js',
      './utils/themeManager.js',
      './config.js',
      './app-updater.js',
    ],
  },
});
