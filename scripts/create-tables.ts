
import { db } from '../db';

async function createTables() {
  try {
    console.log('Creating achievement tables...');
    
    // Create enums
    await db.execute(`
      DO $$ BEGIN
        CREATE TYPE achievement_type AS ENUM (
          'referral_streak',
          'monthly_target',
          'career_milestone',
          'quality_rating',
          'speed_hero',
          'team_player'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(`
      DO $$ BEGIN
        CREATE TYPE achievement_tier AS ENUM (
          'bronze',
          'silver',
          'gold',
          'platinum',
          'diamond'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create achievements table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        type achievement_type NOT NULL,
        tier achievement_tier NOT NULL,
        required_score INTEGER NOT NULL,
        reward_amount INTEGER NOT NULL,
        icon_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS achievement_type_idx ON achievements(type);
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS achievement_tier_idx ON achievements(tier);
    `);

    // Create user_achievements table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        achievement_id INTEGER REFERENCES achievements(id) NOT NULL,
        progress INTEGER DEFAULT 0 NOT NULL,
        current_tier achievement_tier DEFAULT 'bronze' NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE NOT NULL,
        completed_at TIMESTAMP,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE(user_id, achievement_id)
      );
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS user_achievement_user_idx ON user_achievements(user_id);
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS user_achievement_achievement_idx ON user_achievements(achievement_id);
    `);

    // Create achievement_progress table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS achievement_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        achievement_id INTEGER REFERENCES achievements(id) NOT NULL,
        progress_snapshot JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS achievement_progress_user_idx ON achievement_progress(user_id);
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS achievement_progress_achievement_idx ON achievement_progress(achievement_id);
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS achievement_progress_created_at_idx ON achievement_progress(created_at);
    `);

    console.log('Achievement tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

createTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
