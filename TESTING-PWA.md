# Testing Your PWA

Your Money Tracker app is now running as a PWA! Here's how to test it:

## 🚀 Server Running
- **Local:** http://localhost:3000
- **Network:** http://10.108.4.97:3000 (for mobile testing)

## 📱 How to Test PWA Features

### 1. Test in Browser (Desktop)

**Chrome/Edge:**
1. Open http://localhost:3000
2. Look for the install icon (⊕) in the address bar
3. Click it to install the app
4. OR click the "Install" button that appears on the page
5. The app will open in its own window without URL bar

**Check Service Worker:**
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Service Workers" - you should see your service worker registered
4. Click "Manifest" - verify your app info and icons

### 2. Test Offline Mode

**Method 1 - DevTools:**
1. Open DevTools (F12)
2. Go to "Network" tab
3. Change throttling from "No throttling" to "Offline"
4. Refresh the page - app should still work!
5. Try navigating - cached pages should load

**Method 2 - Disable WiFi:**
1. Turn off your WiFi
2. The app should show "Offline Mode" indicator
3. Try using the app - it should still work

### 3. Test on Mobile

**iOS (iPhone/iPad):**
1. Open Safari
2. Navigate to http://YOUR_NETWORK_IP:3000 (e.g., http://10.108.4.97:3000)
3. Tap the Share button (box with arrow)
4. Scroll and tap "Add to Home Screen"
5. Give it a name and tap "Add"
6. Find the app icon on your home screen
7. Tap to open - it opens WITHOUT Safari UI!

**Android:**
1. Open Chrome
2. Navigate to http://YOUR_NETWORK_IP:3000
3. Tap the menu (⋮)
4. Tap "Add to Home Screen" or "Install app"
5. Confirm installation
6. Find the app on your home screen
7. Tap to open - it opens in standalone mode!

### 4. Test Install Prompt

1. Open the app in a browser (not installed yet)
2. You should see a prompt at the bottom with:
   - App icon (💰)
   - "Install Money Tracker"
   - "Add to home screen for quick access"
3. Click "Install" to install
4. Click "Not now" to dismiss (won't show again for 7 days)

### 5. Test Online/Offline Indicator

1. Start with internet ON
2. Disable WiFi/internet
3. You should see a red badge appear: "🚫 Offline Mode"
4. Re-enable internet
5. You should see a green badge: "✓ Back Online" (disappears after 3 seconds)

## ✅ What to Look For

### When Installed:
- ✅ Opens in its own window (not a browser tab)
- ✅ No URL bar or browser controls
- ✅ Has its own app icon in taskbar/dock
- ✅ Shows app name in window title
- ✅ Looks and feels like a native app

### When Offline:
- ✅ Previously loaded pages still work
- ✅ Offline indicator appears
- ✅ Cached images/assets load instantly
- ✅ Firebase data from cache loads
- ✅ New data syncs when back online

### Performance:
- ✅ Second load is faster (cached assets)
- ✅ Images load instantly from cache
- ✅ Smooth transitions between pages
- ✅ Background updates don't block UI

## 🎨 Expected PWA Behavior

### Display Mode
- **Standalone**: No browser UI (URL bar, back button, etc.)
- **Full Screen**: Uses entire screen
- **App-like**: Native app experience

### Icons
- **Home Screen**: Custom app icon (💰 with green background)
- **Splash Screen**: Shows while app is loading
- **Notification Badge**: Can show unread counts (if implemented)

### Caching
- **Static Assets**: Cached for 24 hours
- **Fonts**: Cached for 7 days
- **API Routes**: Network-first, fallback to cache
- **Pages**: Cached and updated in background

## 🐛 Common Issues

**"Install" button doesn't appear:**
- Make sure you're on HTTPS or localhost
- Check if the app is already installed
- Clear browser cache and reload

**Service worker not working:**
- Service workers only work on HTTPS (or localhost)
- Check browser console for errors
- Try unregistering old service workers in DevTools

**Icons not showing:**
- Run `node generate-icons.js` to regenerate
- Clear browser cache
- Check manifest.json is accessible at /manifest.json

**Offline mode not working:**
- Build the app first: `npm run build`
- Service worker is disabled in dev mode
- Run production server: `npm start`

## 🎯 PWA Score

Test your PWA with Lighthouse:
1. Open Chrome DevTools
2. Go to "Lighthouse" tab
3. Check "Progressive Web App"
4. Click "Generate report"
5. Should score 90+ for PWA

## 📊 Test Checklist

- [ ] Install prompt appears
- [ ] Can install on desktop
- [ ] Can install on mobile (iOS/Android)
- [ ] Opens without URL bar
- [ ] Works offline
- [ ] Shows offline indicator
- [ ] Service worker registered
- [ ] Manifest.json accessible
- [ ] Icons display correctly
- [ ] Fast loading (cached assets)
- [ ] Smooth navigation
- [ ] Firebase data persists offline
- [ ] Syncs when back online

## 🎉 Success Indicators

If you can check all these, your PWA is working perfectly:

✅ **Installability**: App can be installed on home screen  
✅ **Offline**: Works without internet connection  
✅ **Standalone**: Opens without browser UI  
✅ **Fast**: Loads quickly from cache  
✅ **Reliable**: Always responsive, even with poor connection  
✅ **Engaging**: Feels like a native app  

Enjoy your new Progressive Web App! 🚀
