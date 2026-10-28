---
name: Expo web preview compatibility
description: NativeWind and secure token storage need separate web-preview handling in this Expo project.
---

For Expo SDK 57 web previews, `expo-secure-store` is not a usable browser storage shim; use browser storage on web and SecureStore only on native platforms. NativeWind 4 needs its `react-native-css-interop` peer installed, and class-based dark mode avoids a runtime scheme-setting error. Use `window.location.origin` for web API calls when the Replit Expo host proxies the API at `/api`; use the configured Replit domain for native builds.

**Why:** Expo's browser preview exercises web implementations of native packages and NativeWind's generated color-scheme runtime, which can fail even when TypeScript passes and native bundles succeed. Calling a separate Replit development hostname from the browser can also trigger avoidable cross-origin preflight failures.

**How to apply:** When changing auth storage or NativeWind configuration, verify the browser preview as well as iOS and Android bundles. A missing React Native DevTools system library may warn without blocking app startup.

For Replit Auth, use the server's cookie-based `/api/login` and `/api/logout` redirects in browser previews; retain the Expo AuthSession PKCE code exchange and SecureStore bearer token flow on native platforms.

**Why:** Replit's auth architecture separates web and native flows. The browser preview's mobile-style token exchange continued to receive an OIDC 400 after its cross-origin API issue was fixed, while the same-origin server login route correctly produced the web callback redirect.

**How to apply:** Keep browser session checks on `GET /api/auth/user` with cookies and route callback failures back to the app with a visible error. Keep native authorization-code exchange and bearer-session handling separate, and verify both platform paths after auth changes.
