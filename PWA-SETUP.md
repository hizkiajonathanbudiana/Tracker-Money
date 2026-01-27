# PWA Setup Guide

## Features Added

Your Money Tracker app is now a **Progressive Web App (PWA)** with the following features:

### ✨ Key Features

1. **Installable**: Users can install the app on their device (home screen)
2. **Offline Support**: Works without internet connection
3. **No URL Bar**: Runs in standalone mode like a native app
4. **Fast Loading**: Uses service workers for caching
5. **Online/Offline Status**: Visual indicator when connection changes
6. **Install Prompt**: Custom UI to prompt users to install the app

### 📱 Installation

#### On Mobile (iOS/Android):
1. Open the app in your browser
2. Tap the "Install" button when the prompt appears, OR
3. **iOS**: Tap the Share button → "Add to Home Screen"
4. **Android**: Tap the menu (⋮) → "Add to Home Screen" or "Install App"

#### On Desktop (Chrome/Edge):
1. Look for the install icon (⊕) in the address bar
2. Click "Install" in the browser prompt, OR
3. Use the custom install prompt that appears in the app

### 🔧 How It Works

#### Service Worker
- The app uses `next-pwa` to generate a service worker
- Caches static assets (JS, CSS, images, fonts)
- Implements caching strategies for different resource types
- Automatically updates when new content is available

#### Manifest
- `public/manifest.json` defines the app metadata
- Specifies icons, theme colors, and display mode
- Tells the browser how to launch the app

#### Offline Mode
- Cached pages work without internet
- Firebase data is cached by the browser
- Custom offline page shows when routes aren't cached
- Online/offline indicator shows connection status

### 🎨 App Icons

Icons are generated in multiple sizes (72px to 512px):
- Located in `public/icon-*.png`
- Generated using `generate-icons.js` script
- Features a dollar sign design with emerald green theme

### 🚀 Development

```bash
# Development mode (PWA disabled)
npm run dev

# Build for production (PWA enabled)
npm run build

# Run production build
npm start
```

### 📝 Files Added/Modified

**New Files:**
- `public/manifest.json` - PWA manifest
- `public/icon-*.png` - App icons (various sizes)
- `public/offline.html` - Offline fallback page
- `src/components/InstallPWA.tsx` - Install prompt component
- `src/components/OnlineStatus.tsx` - Online/offline indicator
- `generate-icons.js` - Icon generation script

**Modified Files:**
- `next.config.mjs` - Added PWA configuration
- `src/app/layout.tsx` - Added PWA metadata
- `src/app/app/layout.tsx` - Added PWA components
- `src/app/globals.css` - Added PWA animations
- `.gitignore` - Excluded generated service worker files

### 🔒 Security Notes

- Service workers only work over HTTPS (or localhost)
- Firebase credentials should be in environment variables
- Service worker is disabled in development mode

### 🎯 User Experience

**When Installed:**
- ✅ No URL bar or browser UI
- ✅ Launches instantly from home screen
- ✅ Works offline with cached data
- ✅ Native app-like experience
- ✅ Separate window from browser

**Caching Strategy:**
- **Static Assets**: Stale-while-revalidate (serve cached, update in background)
- **API Routes**: Network-first (try network, fallback to cache)
- **Firebase**: Excluded from caching (handled by Firebase SDK)
- **Images**: Cached for 24 hours
- **Fonts**: Cached for 7 days

### 🐛 Troubleshooting

**PWA not installing:**
1. Ensure you're using HTTPS (or localhost)
2. Check browser console for errors
3. Verify manifest.json is accessible
4. Clear browser cache and try again

**Service worker not updating:**
1. Close all app tabs
2. Clear browser cache
3. Unregister old service worker in DevTools
4. Reload the page

**Icons not showing:**
1. Run `node generate-icons.js` to regenerate icons
2. Verify icons exist in `public/` folder
3. Check manifest.json paths are correct

### 📱 Testing PWA

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to "Application" tab
3. Check "Service Workers" section
4. Use "Lighthouse" to audit PWA score

**Test Offline Mode:**
1. Open DevTools → Network tab
2. Select "Offline" from throttling dropdown
3. Refresh the page - app should still work

### 🎨 Customization

**Change App Colors:**
- Edit `theme_color` in `manifest.json`
- Update colors in `generate-icons.js`
- Modify CSS variables in `globals.css`

**Change App Name:**
- Update `name` and `short_name` in `manifest.json`
- Update `title` in `layout.tsx`

**Modify Caching:**
- Edit `runtimeCaching` in `next.config.mjs`
- Adjust cache expiration times
- Add/remove URL patterns

### 📊 PWA Checklist

- ✅ Manifest.json configured
- ✅ Service worker registered
- ✅ Icons in multiple sizes
- ✅ HTTPS ready
- ✅ Offline fallback page
- ✅ Install prompt
- ✅ Viewport meta tags
- ✅ Theme color
- ✅ Apple touch icons
- ✅ Display: standalone

Your Money Tracker is now a fully functional PWA! 🎉
