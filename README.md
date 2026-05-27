# NativeScriptRN

NativeScriptRN is an Expo + React Native iOS demo that uses
`@nativescript/react-native` to build UIKit-first screens directly from
TypeScript.

## Features

- Native `UITabBarController` tabs with per-tab accessory actions
- Inline `UINavigationController` titles with scroll-aware native bars
- PassKit add-pass flow and native Wallet-style pass preview
- Metal-backed pass shine rendered through NativeScript
- VisionKit document scanning with last-scan PDF handoff
- QuickLook PDF presentation

## Setup

```bash
npm install
```

## Run

```bash
npx expo run:ios
```

The app targets Expo SDK 56 and uses native iOS APIs, so the iOS simulator or a
physical iPhone is required for the full experience.

## Notes

- The included `.pkpass` fixture is for development only.
- Document scanning requires camera access on a physical device.
- The Metal shine view is rendered on demand to avoid display-link callbacks
  into JavaScript.

## License

MIT
