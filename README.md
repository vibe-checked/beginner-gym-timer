# Beginner Gym Timer

A local-only Expo + React Native gym rest timer.

## Prerequisites

- Node.js
- npm
- Xcode, for iOS Simulator or wired iPhone builds
- Expo Go installed on your iPhone, for UI-only testing

Install dependencies after cloning:

```bash
npm install
```

## Run On Expo Go

Expo Go is useful for quick UI checks, but it is not the best place to test this app's full notification behavior. Interactive local notification actions require a development build on a real device.

Start Metro for Expo Go:

```bash
npx expo start
```

Then scan the QR code with the Expo Go app.

If your phone cannot find the local server, use a tunnel:

```bash
npx expo start --tunnel
```

## Run On iOS Simulator

Use the simulator for normal app navigation and layout testing.

Start the app on an iOS Simulator:

```bash
npx expo run:ios
```

Or start Metro first and press `i`:

```bash
npx expo start
```

The simulator is not a perfect replacement for lock-screen notification testing. Use a real device for that.

## Run On A Wired iPhone

Use a wired iPhone development build for the most reliable notification testing.

Make sure the phone is connected by USB, unlocked, trusted by the Mac, and has Developer Mode enabled.

Build and install the development build:

```bash
npx expo run:ios --device
```

If Expo needs a specific device ID, list devices in the prompt or pass the ID directly:

```bash
npx expo run:ios --device <device-id>
```

After the app is installed, start Metro for the development build:

```bash
npx expo start --dev-client
```

If the app says no development server was found, use a tunnel:

```bash
npx expo start --dev-client --tunnel
```

Then open **Gym Timer** on the iPhone.

If iOS says the developer is untrusted, go to:

```text
Settings -> General -> VPN & Device Management
```

Trust the Apple Development profile, then open the app again.

## Tests

Run TypeScript checks:

```bash
npx tsc --noEmit
```

Run unit tests:

```bash
npm test -- --silent
```
