# AccessLanka Mobile App

<div align="center">
  <img src="./assets/icon.png" alt="AccessLanka Logo" width="120" height="120">
  
  **An accessibility-focused mobile application for discovering and reviewing accessible places in Sri Lanka**
  
  [![Expo](https://img.shields.io/badge/Expo-54.0.13-000020?style=flat&logo=expo)](https://expo.dev/)
  [![React Native](https://img.shields.io/badge/React%20Native-0.81.4-61DAFB?style=flat&logo=react)](https://reactnative.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the App](#-running-the-app)
- [Building](#-building)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Contributing](#-contributing)
- [License](#-license)

---

## About

**AccessLanka** is a comprehensive mobile application designed to help people with disabilities and accessibility needs discover, review, and share information about accessible places across Sri Lanka. The app empowers users to contribute to a community-driven database of accessibility information, making travel and daily activities more accessible for everyone.

### Mission

To create an inclusive society by providing comprehensive accessibility information about businesses, places, and attractions in Sri Lanka, enabling people with diverse accessibility needs to explore their world with confidence.

---

## Features

### Core Features

- **Explore Places**: Browse and search for accessible businesses, attractions, and places
- **Interactive Maps**: View locations on an interactive map with accessibility indicators
- **Detailed Reviews**: Read and write comprehensive accessibility reviews with category-specific ratings
- **MapMissions**: Participate in community challenges to map accessibility features
- **Business Listings**: Add and manage your own business with accessibility information
- **Favorites**: Save and organize your favorite accessible places
- **Chatbot Assistant**: Get instant answers about accessibility through AI-powered chat

### Accessibility Features

- **Multiple Categories**: Mobility, Visual, Hearing, and Cognitive accessibility ratings
- **Feature Tracking**: Detailed accessibility features including:
  - Wheelchair access
  - Braille signage
  - Hearing loops
  - Service animals
  - Accessible parking
  - And many more...
- **Accessibility Preferences**: Customize the app based on your specific needs
- **Screen Reader Support**: Full compatibility with screen readers
- **High Contrast Mode**: Enhanced visibility options

### Community Features

- **Community Posts**: Share experiences and tips with other users
- **Review System**: Rate places on multiple accessibility dimensions
- **Photo Sharing**: Upload photos of accessibility features
- **Helpful Votes**: Mark reviews as helpful to highlight quality content
- **Reply to Reviews**: Engage in discussions about accessibility

### User Management

- **User Profiles**: Customizable profiles with avatar and accessibility needs
- **Authentication**: Secure login and registration with email verification
- **Password Reset**: Easy password recovery via email
- **Edit Profile**: Update your information and preferences
- **My Reviews**: Track all your submitted reviews
- **My Submissions**: Manage your business submissions

### UI/UX

- **Light/Dark Mode**: Automatic theme switching based on system preferences
- **Modern Design**: Clean, intuitive interface with Material Design
- **Smooth Animations**: Polished transitions and interactions
- **Haptic Feedback**: Tactile responses for better user experience
- **Localization Ready**: Built with internationalization in mind

---

## Tech Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and build system
- **React Navigation** - Navigation library
- **React Native Paper** - Material Design component library
- **TypeScript** - Type-safe JavaScript

### Backend & Services
- **Supabase** - Backend as a Service (PostgreSQL database, Auth, Storage)
- **Expo Location** - GPS and location services
- **Expo Image Picker** - Camera and photo gallery access
- **Expo Notifications** - Push notifications

### Key Libraries
- **React Native Maps** - Interactive map integration
- **Async Storage** - Local data persistence
- **React Native Reanimated** - Advanced animations
- **Expo Speech** - Text-to-speech for accessibility
- **React Native Vector Icons** - Icon library

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Package manager
- **Expo CLI** - `npm install -g expo-cli`
- **Git** - Version control
- **iOS Simulator** (Mac only) or **Android Studio** (for Android development)
- **Expo Go App** (for testing on physical devices) - [iOS](https://apps.apple.com/app/apple-store/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ricca20/Accesslanka-Mobile-App.git
   cd Accesslanka-Mobile-App
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory (or configure directly in `src/lib/supabase.js`):
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase Database**
   
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `src/lib/database-schema.txt` in the Supabase SQL Editor
   - Configure authentication settings (enable email auth)
   - Set up storage buckets for images if needed

---

## Configuration

### Supabase Setup

1. **Authentication**
   - Enable Email authentication in Supabase Dashboard
   - Configure email templates for verification and password reset
   - Set up deep linking redirect URLs:
     - `accesslanka://reset-password`
     - `accesslanka://confirm-email`

2. **Database**
   - Execute the complete schema from `src/lib/database-schema.txt`
   - Verify all tables, indexes, and RLS policies are created
   - Optionally run `populate-malabe-places.js` to seed sample data

3. **Storage** (Optional)
   - Create storage buckets for user avatars and place images
   - Configure bucket policies for public/private access

### App Configuration

Edit `app.config.js` to customize:
- App name and slug
- Bundle identifiers (iOS/Android)
- Icon and splash screen
- Permissions
- Deep linking configuration

---

## Running the App

### Development Mode

Start the Expo development server:

```bash
npm start
# or
expo start
```

This will open Expo DevTools in your browser. From here you can:

### Run on iOS Simulator (Mac only)
```bash
npm run ios
# or
expo run:ios
```

### Run on Android Emulator
```bash
npm run android
# or
expo run:android
```

### Run on Physical Device
1. Install **Expo Go** app on your device
2. Scan the QR code from the Expo DevTools
3. The app will load on your device

### Web (for testing only)
```bash
npm run web
# or
expo start --web
```

---

## Building

### Build for Android

**APK (for testing)**
```bash
eas build --profile apk --platform android
```

**AAB (for Play Store)**
```bash
eas build --profile production --platform android
```

### Build for iOS

```bash
eas build --profile production --platform ios
```

### Prerequisites for Building
1. Install EAS CLI: `npm install -g eas-cli`
2. Login to Expo: `eas login`
3. Configure build profiles in `eas.json`

---

## Project Structure

```
Accesslanka-Mobile-App/
├── assets/                      # Static assets (images, fonts)
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
│
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── ChangePasswordModal.js
│   │   ├── CreatePostModal.js
│   │   ├── MapMissionBadge.js
│   │   ├── PostDetailsModal.js
│   │   └── UserBadge.js
│   │
│   ├── context/                 # React Context providers
│   │   ├── AuthContext.js       # Authentication state
│   │   ├── SettingsContext.js   # App settings
│   │   └── ThemeContext.js      # Theme management
│   │
│   ├── lib/                     # Core libraries and utilities
│   │   ├── database-schema.txt  # PostgreSQL schema
│   │   ├── database-setup.js    # Database initialization
│   │   ├── database.js          # Database utilities
│   │   └── supabase.js          # Supabase client
│   │
│   ├── navigation/              # Navigation configuration
│   │   ├── AppNavigator.js      # Root navigator
│   │   └── MainTabNavigator.js  # Bottom tab navigation
│   │
│   ├── screens/                 # App screens
│   │   ├── auth/               # Authentication screens
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   ├── ForgotPasswordScreen.js
│   │   │   └── ResetPasswordScreen.js
│   │   │
│   │   ├── main/               # Main app screens
│   │   │   ├── ExploreScreen.js
│   │   │   ├── BusinessesScreen.js
│   │   │   ├── ReviewsScreen.js
│   │   │   ├── CommunityScreen.js
│   │   │   └── MapMissionScreen.js
│   │   │
│   │   └── ...                 # Other screens
│   │
│   ├── services/                # Business logic and API calls
│   │   ├── AccessibilityService.js
│   │   ├── ChatbotService.js
│   │   ├── CommunityService.js
│   │   ├── DatabasePlacesService.js
│   │   └── StorageService.js
│   │
│   ├── theme/                   # Theme configuration
│   │   └── theme.js
│   │
│   └── utils/                   # Helper functions
│       └── accessibilityMapping.js
│
├── App.js                       # App entry point
├── app.config.js               # Expo configuration
├── package.json                # Dependencies
├── tsconfig.json              # TypeScript configuration
├── babel.config.js            # Babel configuration
├── eas.json                   # EAS Build configuration
└── README.md                  # This file
```

---

## Database Schema

The app uses **PostgreSQL** (via Supabase) with the following main tables:

### Core Tables
- **users** - User profiles and authentication
- **businesses** - Business listings with accessibility info
- **places** - General places and attractions
- **categories** - Place categories (restaurants, hotels, etc.)

### Review System
- **reviews** - User reviews with accessibility ratings
- **review_replies** - Replies to reviews
- **review_helpful** - Helpful vote tracking

### User Features
- **user_favorites** - Saved places
- **map_missions** - Community mapping challenges
- **community_posts** - User-generated content

### Key Features
- **Row Level Security (RLS)** - Secure data access
- **Triggers** - Automatic timestamp updates
- **Indexes** - Optimized queries for location-based searches
- **JSONB Fields** - Flexible accessibility ratings storage

See `src/lib/database-schema.txt` for the complete schema.

---

## Key Screens

### Authentication Flow
- **Landing Screen** - Welcome screen
- **Intro Slides** - Feature introduction
- **Login/Register** - User authentication
- **Forgot/Reset Password** - Password recovery

### Main Navigation (Bottom Tabs)
- **Explore** - Discover places with map and list views
- **Businesses** - Browse business listings
- **Reviews** - Read and write accessibility reviews
- **Community** - Social features and discussions
- **MapMissions** - Accessibility mapping challenges

### Profile & Settings
- **Profile** - View and edit user profile
- **Settings** - App preferences and accessibility settings
- **My Reviews** - User's review history
- **My Favorites** - Saved places
- **My Business Submissions** - Managed business listings

---

## Development Tips

### Hot Reloading
The app supports hot reloading. Changes to your code will automatically reflect in the app without a full restart.

### Debugging
- Use React Native Debugger for advanced debugging
- Check Expo DevTools for logs and diagnostics
- Use `console.log()` statements (visible in terminal)

### Testing Deep Links
```bash
# iOS Simulator
xcrun simctl openurl booted accesslanka://reset-password

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "accesslanka://reset-password"
```

---

## Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Contribution Guidelines
- Follow the existing code style
- Write clear commit messages
- Add comments for complex logic
- Test on both iOS and Android if possible
- Update documentation as needed

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Authors

- Yasindu Gamage
- Nethal Fernando
- Ricky Perera
- Naduli Weerasinghe

---

## Acknowledgments

- Expo team for the amazing development platform
- Supabase for the backend infrastructure
- React Native community for excellent libraries
- All contributors who help make this app better
- Users who provide valuable feedback

---

## Support

If you encounter any issues or have questions:

- **GitHub Issues**: [Create an issue](https://github.com/Ricca20/Accesslanka-Mobile-App/issues)
- **Email**: support@accesslanka.com (if applicable)

---

---

<div align="center">
  <p>Made with ❤️ for a more accessible Sri Lanka</p>
  <p>Star this repo if you find it helpful!</p>
</div>
