# 📱 Install Prompt Behavior Guide

## How the Install Prompt Works

### Timing
- **Appears**: 5 seconds after page load
- **Position**: Bottom of screen, above bottom navigation
- **Dismissible**: Yes, with "X" button

### User Experience Flow

```
User visits site
    ↓
Wait 5 seconds
    ↓
Install prompt appears
    ↓
┌─────────────────────────────────────┐
│  iOS User          Android User      │
├─────────────────────────────────────┤
│  Shows manual      Shows install     │
│  instructions      button            │
│  (Safari steps)    (one-tap)         │
└─────────────────────────────────────┘
    ↓
User installs or dismisses
    ↓
If dismissed: Won't show again (localStorage)
If installed: Prompt never shows again
```

---

## Prompt Appearance

### Android/Desktop Version:
```
┌─────────────────────────────────────┐
│ 📥  Install CampusMart          ✕   │
│     Quick access from home screen   │
│                                     │
│ Install our app for faster access  │
│ and offline support!                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  📥  Install App                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ✓ Works offline • ✓ Fast & secure  │
│ • ✓ No app store needed             │
└─────────────────────────────────────┘
```

### iOS Version:
```
┌─────────────────────────────────────┐
│ 📥  Install CampusMart          ✕   │
│     Quick access from home screen   │
│                                     │
│ To install this app on your iPhone: │
│ 1. Tap the Share button ⎙ in Safari│
│ 2. Scroll down and tap "Add to     │
│    Home Screen"                     │
│ 3. Tap "Add" in the top right      │
│                                     │
│ ✓ Works offline • ✓ Fast & secure  │
│ • ✓ No app store needed             │
└─────────────────────────────────────┘
```

---

## Detection Logic

### Already Installed?
```javascript
// Checks if app is in standalone mode
window.matchMedia('(display-mode: standalone)').matches
```
**Result**: Prompt doesn't show

### iOS Device?
```javascript
/iPad|iPhone|iPod/.test(navigator.userAgent)
```
**Result**: Shows iOS instructions

### Android/Desktop?
```javascript
// Listens for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', ...)
```
**Result**: Shows install button

### Previously Dismissed?
```javascript
localStorage.getItem('pwa-install-dismissed')
```
**Result**: Prompt doesn't show

---

## User Actions

### 1. Install (Android/Desktop)
- User clicks "Install App" button
- Browser shows native install dialog
- User confirms
- App installs to home screen/desktop
- Prompt disappears forever

### 2. Dismiss
- User clicks "X" button
- Prompt disappears
- Choice saved to localStorage
- Won't show again on this device

### 3. Ignore
- User doesn't interact
- Prompt stays visible
- Will show on next visit (if not dismissed)

---

## Customization Options

### Change Timing
In `src/components/InstallPrompt.tsx`:
```typescript
setTimeout(() => {
  setShowPrompt(true);
}, 5000); // Change 5000 to desired milliseconds
```

### Change Position
In `src/components/InstallPrompt.tsx`:
```typescript
className="fixed bottom-20 left-4 right-4 z-50"
// Change bottom-20 to adjust vertical position
```

### Disable Dismiss Memory
In `src/components/InstallPrompt.tsx`:
```typescript
// Remove this line to show prompt every time:
localStorage.setItem('pwa-install-dismissed', 'true');
```

### Force Show on Every Visit
In `src/components/InstallPrompt.tsx`:
```typescript
// Comment out this check:
// const dismissed = localStorage.getItem('pwa-install-dismissed');
```

---

## Testing

### Test on Different Devices:

**iOS (Safari):**
1. Open site in Safari
2. Wait 5 seconds
3. Should see iOS instructions
4. Follow steps to install

**Android (Chrome):**
1. Open site in Chrome
2. Wait 5 seconds
3. Should see install button
4. Tap to install

**Desktop (Chrome/Edge):**
1. Open site
2. Wait 5 seconds
3. Should see install button
4. Click to install

### Test Dismiss Behavior:
1. Wait for prompt
2. Click "X"
3. Refresh page
4. Prompt should NOT appear
5. Clear localStorage to reset
6. Prompt appears again

### Test Already Installed:
1. Install the app
2. Open installed app
3. Prompt should NOT appear

---

## Troubleshooting

### Prompt Not Showing?

**Check:**
1. Is app already installed? (standalone mode)
2. Was it dismissed before? (check localStorage)
3. Is it HTTPS? (required for PWA)
4. Wait full 5 seconds
5. Check browser console for errors

**iOS Specific:**
- Must use Safari browser
- Chrome/Firefox won't work on iOS

**Android Specific:**
- Chrome is recommended
- Some browsers don't support PWA

### Prompt Shows But Install Fails?

**Check:**
1. HTTPS enabled (required)
2. manifest.json accessible
3. Service worker registered
4. All icons load correctly
5. No console errors

---

## Best Practices

### ✅ Do:
- Show prompt after user has browsed a bit (5+ seconds)
- Make it easy to dismiss
- Explain benefits clearly
- Use branded design
- Test on real devices

### ❌ Don't:
- Show immediately on page load (annoying)
- Make it impossible to dismiss
- Show on every page (use once per session)
- Use generic browser prompt only
- Forget to test on iOS

---

## Analytics (Optional)

Track these events:
1. **Prompt Shown** - How many users see it
2. **Install Clicked** - How many click install
3. **Dismissed** - How many dismiss it
4. **Installed** - How many complete install

Add tracking in `src/components/InstallPrompt.tsx`:
```typescript
// When prompt shows
console.log('Install prompt shown');

// When user clicks install
console.log('Install button clicked');

// When user dismisses
console.log('Install prompt dismissed');
```

---

## Summary

The install prompt:
- ✅ Shows after 5 seconds
- ✅ Adapts to device (iOS vs Android)
- ✅ Can be dismissed
- ✅ Remembers user choice
- ✅ Doesn't show if already installed
- ✅ Beautiful branded design
- ✅ Shows benefits clearly
- ✅ Positioned above bottom nav

**Result**: Users get a smooth, non-intrusive install experience! 🎉
