# Accessibility Contributions Setup

This guide helps you set up the accessibility contributions feature that allows MapMission participants to add photos, reviews, and ratings about accessibility features.

## Overview

The accessibility contributions system includes:
- **Photos**: Users can upload photos of accessibility features (ramps, elevators, parking, etc.)
- **Reviews**: Users can write detailed reviews about accessibility features with difficulty ratings
- **Ratings**: Users can rate accessibility features on availability, condition, and overall accessibility

## Database Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. Log into your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `src/lib/setup_accessibility_tables.sql`
4. Run the SQL script

### Option 2: Using Command Line

1. Set your environment variables:
```bash
export SUPABASE_URL=https://your-project-ref.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

2. Run the setup script:
```bash
./setup_accessibility_db.sh
```

## Database Tables Created

### accessibility_photos
- Stores photos of accessibility features
- Links to missions, businesses, and users
- Includes feature type and descriptions
- Has RLS policies for security

### accessibility_reviews
- Stores text reviews of accessibility features
- Includes difficulty levels (easy/moderate/difficult/impossible)
- Has helpfulness ratings (1-5 stars)
- Includes update tracking

### accessibility_ratings
- Stores numerical ratings for accessibility features
- Rates accessibility, availability, and condition (1-5 scale)
- Prevents duplicate ratings per user/mission/feature
- Includes optional notes

## Features

### For Mission Participants
- Take photos of accessibility features during missions
- Write detailed reviews about accessibility experiences
- Rate features on multiple criteria
- View contribution progress in real-time

### For Mission Organizers
- Track participant contributions
- View aggregated accessibility data
- Monitor mission progress

### For All Users
- Browse accessibility photos and reviews
- Make informed decisions about venue accessibility
- Contribute to community accessibility knowledge

## Navigation Flow

1. **Join a MapMission** → MapMissionScreen shows "Add Accessibility Contribution" button
2. **Tap Contribution Button** → Opens AccessibilityContributionScreen
3. **Choose Tab** → Photos, Reviews, or Ratings
4. **Add Content** → Upload photos, write reviews, or rate features
5. **Submit** → Contributions are saved and progress updates

## Error Handling

The system includes robust error handling for:
- Missing database tables (graceful degradation)
- Network connectivity issues
- Photo upload failures
- Form validation errors

## Technical Requirements

- React Native 0.81.4+
- Expo SDK 54+
- Supabase client
- expo-image-picker for photo functionality
- Proper Supabase storage bucket configuration

## Troubleshooting

### Missing Tables Error (PGRST205)
If you see database errors about missing tables, run the SQL setup script in your Supabase dashboard.

### Photo Upload Issues
Ensure your Supabase storage bucket is properly configured with appropriate policies for authenticated users.

### Import Path Errors
The system uses relative imports. If you see import errors, check that file paths match your project structure.

## File Structure

```
src/
├── lib/
│   ├── database.js                    # Database service methods
│   └── setup_accessibility_tables.sql # Database schema
├── screens/
│   ├── AccessibilityContributionScreen.js # Main contribution interface
│   └── main/MapMissionScreen.js       # Mission screen with contribution access
└── components/
    └── MapMissionSetupModal.js        # Mission setup modal
```

## Next Steps

1. Run the database setup
2. Test the contribution flow in your app
3. Configure Supabase storage policies if needed
4. Customize feature types and rating criteria as needed

The accessibility contributions system is now ready to help make your community more accessible! 🌟