# NativeScript Expo

An Expo project demonstrating how NativeScript can be used as a TurboModule to have
deep iOS integration by directly exposing all of the iOS SDK in TypeScript.

Why?

- You use latest SDK APIs directly in TypeScript without any more dependencies
- Hot-reload even native components without recompiling your React Native project

The development of new NativeScript runtime using Node-API led to further explorations,
like integrating with runtimes like Node.js and Deno on desktop. But now we're
pushing it further, and adding a built-in JSI backend to NativeScript runtime.

This allows NativeScript apps to use Hermes as an engine choice, along with V8, QuickJS,
and JSC. Not only that, this allows NativeScript to compile as a JSI module for React Native
apps as well - allowing full native API access using the foundation NativeScript apps have
been built on for years.

## Features
- **Apple Wallet (PassKit):** Generate and add “.pkpass” passes directly to the iOS Wallet.
- **Document Scanner:** Native iOS document scanning functionality (VisionKit).
- **PDF Viewer:** Native PDF rendering component (PDFKit).
- **Native Tabs:** Seamless integration with native tab bar controllers.
- **Metal:** Shader used to add shine effect to pass, along with CoreMotion for gyro effects.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run on iOS:
   ```bash
   npx expo run:ios
   ```

## License

[MIT licensed.](./LICENSE)
