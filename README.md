<div align="center">
  <img src="https://raw.githubusercontent.com/tarunhawdia/notification-manager/main/assets/logo.png" alt="BuzzKill Clone Logo" width="120" />
  
  # BuzzKill Clone - Smart Notification Manager

  <p>
    <strong>A modern, privacy-focused Android notification manager built with React Native.</strong>
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#how-it-works">How It Works</a> •
    <a href="#screenshots">Screenshots</a> •
    <a href="#installation">Installation</a> •
    <a href="#contributing">Contributing</a>
  </p>
</div>

---

## 📱 About

This is an open-source clone of the popular Android app "BuzzKill", designed to give you ultimate control over your notifications. It focuses on a specific, powerful use case: **automatically suppressing notifications from apps you haven't used in a while.**

Tired of getting marketing spam or unhelpful alerts from apps you only open once a month? This app automatically intercepts and dismisses those notifications, keeping your status bar clean and your focus intact.

*Currently focused on Android due to strict iOS background processing limitations.*

## ✨ Features

- 🤫 **Smart Suppression**: Define custom rules to automatically hide notifications from specific apps if you haven't opened them in `X` days.
- ✏️ **Edit & Toggle Rules**: Tap any rule to change its threshold or schedule, or flip a switch to pause it without deleting.
- ⏰ **Quiet-Hours Scheduling**: Optionally restrict suppression to a specific time window (e.g. only silence between 22:00–07:00).
- 📊 **Suppression Stats**: See how many notifications have been silenced overall and per app.
- 🔎 **Search & Sort**: Quickly filter your rules and sort by name, threshold, or number silenced.
- 🎨 **Compact Glassmorphism UI**: A refined, dense dark theme with glassmorphic cards and smooth interactions.
- 🔋 **Battery Efficient**: Uses native Android `UsageStatsManager` to check inactivity efficiently without constant background polling.
- 🔒 **Privacy First**: All rules and usage data stay strictly on your device. No cloud syncing, no external servers.
- 🚀 **React Native + Native Modules**: Built with React Native for the UI, utilizing custom Kotlin native bridges for core Android system functionalities (`NotificationListenerService`).

## ⚙️ How It Works

1. **Grant Permissions**: The app requires two key Android permissions:
   - *Notification Access*: To intercept and read incoming notifications.
   - *Usage Access*: To check when you last opened the app sending the notification.
2. **Set a Rule**: Go to the Rule Editor and enter an app's package name (e.g., `com.whatsapp`) and set an inactivity threshold (e.g., `3` days).
3. **Enjoy the Silence**: When a notification arrives, the app's native background service checks if the rule matches. If you haven't opened the app in the last 3 days, the notification is instantly dismissed before it even buzzes your phone.

## 🛠️ Tech Stack

- **Frontend**: React Native, React Navigation
- **Native (Android)**: Kotlin, Java
- **Core APIs**:
  - `NotificationListenerService`
  - `UsageStatsManager`
  - `SharedPreferences`

## 🚀 Installation

### Prerequisites
- Node.js (v18+)
- Java JDK 17 (Required for modern React Native Android builds)
- Android Studio / Android SDK

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/buzzkill-clone.git
   cd buzzkill-clone
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run on Android:
   ```bash
   npx react-native run-android
   ```
   *Note: Notification listeners and usage stats require testing on a physical Android device or a fully configured emulator with Google Play Services.*

## 🤝 Contributing

Contributions are completely welcome! This was built for personal use but designed to be open-source.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

**Areas needing help:**
- Adding more rule types (e.g., regex matching on notification text).
- UI animations (Lottie / reanimated).
- Per-app custom thresholds within a single multi-app rule.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
