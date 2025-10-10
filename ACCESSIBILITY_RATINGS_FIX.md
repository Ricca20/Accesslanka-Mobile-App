# Accessibility Ratings Fix Documentation

## Problem Overview
The app had a critical mismatch between how accessibility ratings were stored and how they were filtered/displayed:
- Reviews stored ratings using business-specific feature keys (e.g., `wheelchair_accessible`, `elevator_access`)
- Filter logic expected standardized category keys (e.g., `mobility`, `visual`, `hearing`, `cognitive`)
- This caused filtering to fail for most reviews

## Solution

### 1. Created Utility Mapping System
**File:** `src/utils/accessibilityMapping.js`

This utility provides:
- **Feature-to-Category Mapping**: Maps business features to accessibility categories
  - Example: `wheelchair_accessible` → `mobility`
  - Example: `braille_signs` → `visual`
  
- **Conversion Functions**:
  - `featureRatingsToCategoryRatings()`: Converts feature ratings to category ratings
  - `reviewMatchesCategory()`: Checks if a review matches a category filter
  - `getFeatureIcon()`: Gets appropriate icon for any feature/category
  - `formatFeatureLabel()`: Formats feature keys for display

### 2. Updated Review Storage Format
**File:** `src/screens/AddReviewScreen.js`

Reviews now store **both** category and feature ratings:
```javascript
{
  // Standard categories (REQUIRED for filtering)
  mobility: 4,
  visual: 3,
  hearing: 5,
  cognitive: 4,
  
  // Optional: Detailed feature breakdown
  features: {
    wheelchair_accessible: 5,
    elevator_access: 4,
    braille_signs: 3,
    // ... more features
  }
}
```

**How it works:**
1. User rates individual accessibility features (if business has them)
2. System automatically calculates category ratings:
   - Takes the **highest** rating among features in each category
   - Example: If `wheelchair_accessible: 5` and `elevator_access: 4`, then `mobility: 5`
3. Stores both for maximum flexibility

### 3. Fixed Filtering Logic
**File:** `src/screens/main/ReviewsScreen.js`

Updated `getFilteredReviews()` to use `reviewMatchesCategory()` which:
- Checks for direct category ratings (e.g., `mobility: 4`)
- Falls back to checking feature ratings (e.g., `wheelchair_accessible: 5`)
- Works with both old and new data formats

### 4. Updated Display Logic
**File:** `src/screens/PlaceDetailsScreen.js`

Reviews now display:
- **Category ratings** as primary chips (mobility, visual, hearing, cognitive)
- **Feature ratings** as outlined chips (wheelchair_accessible, braille_signs, etc.)

This gives users both a quick overview and detailed breakdown.

## Data Structure

### Valid Accessibility Ratings Formats

#### Format 1: Category-only (Old format)
```json
{
  "mobility": 4,
  "visual": 3,
  "hearing": 5,
  "cognitive": 4
}
```

#### Format 2: Feature-only (Converted automatically)
```json
{
  "wheelchair_accessible": 5,
  "elevator_access": 4,
  "braille_signs": 3
}
```

#### Format 3: Combined (New recommended format)
```json
{
  "mobility": 5,
  "visual": 3,
  "hearing": 4,
  "cognitive": 4,
  "features": {
    "wheelchair_accessible": 5,
    "elevator_access": 4,
    "braille_signs": 3,
    "hearing_loop": 4
  }
}
```

## Feature-to-Category Mapping Reference

### Mobility Features
- `wheelchair_accessible`
- `wheelchair_access`
- `elevator_access`
- `ramp_access`
- `accessible_parking`
- `wide_aisles`
- `accessible_entrance`
- `accessible_restrooms`

### Visual Features
- `braille_signs`
- `large_print`
- `high_contrast`
- `tactile_indicators`
- `guide_dog_friendly`

### Hearing Features
- `hearing_loop`
- `sign_language`
- `visual_alerts`
- `quiet_spaces`

### Cognitive Features
- `audio_guides`
- `clear_signage`
- `quiet_environment`
- `simple_navigation`

## Benefits

1. **✅ Filtering now works correctly** - Reviews filter properly by category
2. **✅ Backward compatible** - Old reviews still work
3. **✅ Detailed information preserved** - Feature ratings stored for detailed display
4. **✅ Flexible** - Easy to add new features/categories
5. **✅ Consistent** - Single source of truth for mappings

## Testing Checklist

- [ ] Create a review with feature ratings
- [ ] Verify category ratings are calculated correctly
- [ ] Filter reviews by mobility - should show reviews with mobility features
- [ ] Filter reviews by visual - should show reviews with visual features
- [ ] Check PlaceDetailsScreen shows both category and feature chips
- [ ] Verify old reviews (category-only) still display correctly

## Migration Notes

**No database migration required!** The JSONB field is flexible enough to accommodate both formats. Existing reviews will continue to work, and the utility functions handle both old and new formats gracefully.

## Future Enhancements

1. Add weighted category scoring (different features have different impacts)
2. Allow custom feature definitions per business type
3. Add accessibility rating aggregation at place/business level
4. Implement ML-based feature suggestions based on review text
