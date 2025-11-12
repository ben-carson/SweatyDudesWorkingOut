/**
 * Development Database Seeding Script
 *
 * Seeds SQLite database with sample data for local development.
 * Run with: npm run db:seed
 */

import { db } from './db-factory';
import { users, exercises } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { DEFAULT_DEV_USER, DEV_USERS } from './auth-dev';

async function seedDevDatabase() {
  console.log('🌱 Seeding development database...');

  try {
    // Seed dev users
    console.log('Creating dev users...');
    for (const devUser of DEV_USERS) {
      const existing = await db.select().from(users).where(eq(users.id, devUser.id));
      if (existing.length === 0) {
        await db.insert(users).values({
          id: devUser.id,
          username: devUser.displayName.toLowerCase().replace(/\s+/g, ''),
          name: devUser.displayName,
        });
        console.log(`  ✓ Created user: ${devUser.displayName} (${devUser.id})`);
      } else {
        console.log(`  - User already exists: ${devUser.displayName}`);
      }
    }

    // Seed common exercises
    console.log('\nCreating sample exercises...');
    const sampleExercises = [
      // Strength exercises (weight)
      { name: 'Bench Press', metricType: 'weight', unit: 'lbs' },
      { name: 'Squat', metricType: 'weight', unit: 'lbs' },
      { name: 'Deadlift', metricType: 'weight', unit: 'lbs' },
      { name: 'Overhead Press', metricType: 'weight', unit: 'lbs' },
      { name: 'Barbell Row', metricType: 'weight', unit: 'lbs' },
      { name: 'Dumbbell Curl', metricType: 'weight', unit: 'lbs' },

      // Bodyweight exercises (count)
      { name: 'Push-ups', metricType: 'count', unit: 'reps' },
      { name: 'Pull-ups', metricType: 'count', unit: 'reps' },
      { name: 'Dips', metricType: 'count', unit: 'reps' },
      { name: 'Sit-ups', metricType: 'count', unit: 'reps' },
      { name: 'Burpees', metricType: 'count', unit: 'reps' },

      // Cardio exercises (duration)
      { name: 'Running', metricType: 'distance', unit: 'miles' },
      { name: 'Cycling', metricType: 'distance', unit: 'miles' },
      { name: 'Swimming', metricType: 'distance', unit: 'meters' },
      { name: 'Plank', metricType: 'duration', unit: 'seconds' },
      { name: 'Jump Rope', metricType: 'duration', unit: 'seconds' },
    ];

    for (const exercise of sampleExercises) {
      const existing = await db.select().from(exercises).where(eq(exercises.name, exercise.name));
      if (existing.length === 0) {
        await db.insert(exercises).values(exercise);
        console.log(`  ✓ Created exercise: ${exercise.name} (${exercise.metricType})`);
      } else {
        console.log(`  - Exercise already exists: ${exercise.name}`);
      }
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log(`\n🚀 You can now run the app with: npm run dev:sqlite`);
    console.log(`   Default dev user: ${DEFAULT_DEV_USER.displayName} (${DEFAULT_DEV_USER.primaryEmail})`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDevDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedDevDatabase };
