---
name: Expo web preview compatibility
description: NativeWind and secure token storage need separate web-preview handling in this Expo project.
---

For Expo SDK 57 web previews, `expo-secure-store` is not a usable browser storage shim; use browser storage on web and SecureStore only on native platforms. NativeWind 4 needs its `react-native-css-interop` peer installed, and class-based dark mode avoids a runtime scheme-setting error.

**Why:** Expo's browser preview exercises web implementations of native packages and NativeWind's generated color-scheme runtime, which can fail even when TypeScript passes and native bundles succeed.

**How to apply:** When changing auth storage or NativeWind configuration, verify the browser preview as well as iOS and Android bundles. A missing React Native DevTools system library may warn without blocking app startup.
