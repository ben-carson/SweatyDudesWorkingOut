# Workout Social App Design Guidelines

## Design Approach
**Reference-Based Approach** - Taking inspiration from fitness apps like Strava, MyFitnessPal, and Nike Training Club, combined with social elements from Instagram and Discord. This app requires strong visual hierarchy for data display while maintaining engaging social features.

## Core Design Elements

### Color Palette
**Primary Colors:**
- Light mode: 220 85% 25% (deep blue)
- Dark mode: 220 75% 15% (darker blue)

**Accent Colors:**
- Success/PR: 142 76% 36% (vibrant green)
- Warning/Rest Day: 45 93% 47% (energetic orange)

**Background Colors:**
- Light mode: 220 20% 98% (off-white)
- Dark mode: 220 25% 8% (dark blue-gray)

### Typography
- **Headers:** Inter (700 weight) for workout titles, user names
- **Body:** Inter (400-500 weight) for stats, descriptions
- **Data Display:** JetBrains Mono for numbers, weights, reps

### Layout System
**Spacing Units:** Consistently use Tailwind units of 2, 4, 6, and 8
- p-2 for tight spacing (buttons, chips)
- p-4 for standard content padding
- p-6 for section spacing
- p-8 for major layout gaps

### Component Library

**Navigation:**
- Bottom tab bar for mobile (Workout, Feed, Profile, Friends)
- Clean top navigation with user avatar and notifications

**Data Display:**
- Workout cards with exercise thumbnails and key stats
- Progress charts with subtle gradients
- Stat comparison tables with clear visual hierarchy
- Achievement badges and PR indicators

**Forms:**
- Exercise input with quick-add buttons for common weights/reps
- Timer components for rest periods
- Photo upload for workout selfies

**Social Elements:**
- Friend activity feed with like/comment functionality
- Leaderboards with friendly competition metrics
- Workout sharing cards optimized for social media

**Core UI:**
- Floating action button for "Start Workout"
- Swipe gestures for quick actions (mark complete, delete)
- Modal overlays for detailed workout views

### Visual Hierarchy
- Use bold typography and color contrast for key metrics (PRs, streaks)
- Subtle shadows and borders to separate workout sessions
- Progressive disclosure for detailed exercise information

### Mobile-First Considerations
- Large touch targets (minimum 44px)
- Thumb-friendly navigation placement
- Swipe gestures for common actions
- Optimized for one-handed use during workouts

### Images
**Exercise Thumbnails:** Small illustrated icons for common exercises (push-up, squat, deadlift) placed in workout cards and exercise selection screens.

**Profile Photos:** Circular user avatars throughout social features.

**No Large Hero Image:** This utility-focused app prioritizes quick access to workout logging over marketing imagery.

**Achievement Graphics:** Small celebration graphics for milestones and personal records.

### Animations
**Minimal Usage:**
- Subtle micro-interactions for button presses
- Smooth transitions between workout states
- Progress bar animations for set completion
- **Avoid:** Complex page transitions or distracting effects during workout sessions