import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { Genre } from '../../entities/genre.entity';
import { Mood } from '../../entities/mood.entity';
import { Song } from '../../entities/song.entity';
import { Album } from '../../entities/album.entity';
import { Playlist } from '../../entities/playlist.entity';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'otr_db',
  entities: [User, Genre, Mood, Song, Album, Playlist],
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();
  console.log('🌱 Starting database seeding...');

  const userRepository = dataSource.getRepository(User);
  const genreRepository = dataSource.getRepository(Genre);
  const moodRepository = dataSource.getRepository(Mood);

  // Seed Admin User
  const adminEmail = 'admin@otr.com';
  const existingAdmin = await userRepository.findOne({ where: { email: adminEmail } });
  
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = userRepository.create({
      email: adminEmail,
      username: 'otr_admin',
      password: hashedPassword,
      displayName: 'OTR Admin',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isVerified: true,
    });
    await userRepository.save(admin);
    console.log('✅ Admin user created: admin@otr.com / admin123');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // Seed Demo Creator
  const creatorEmail = 'creator@otr.com';
  const existingCreator = await userRepository.findOne({ where: { email: creatorEmail } });
  
  if (!existingCreator) {
    const hashedPassword = await bcrypt.hash('creator123', 10);
    const creator = userRepository.create({
      email: creatorEmail,
      username: 'dj_alleycat',
      password: hashedPassword,
      displayName: 'DJ Alleycat',
      bio: 'Underground DJ and producer from Brooklyn',
      role: UserRole.CREATOR,
      status: UserStatus.ACTIVE,
      isVerified: true,
      genres: ['Hip-Hop', 'Electronic'],
    });
    await userRepository.save(creator);
    console.log('✅ Creator user created: creator@otr.com / creator123');
  } else {
    console.log('ℹ️  Creator user already exists');
  }

  // Seed Demo User
  const userEmail = 'demo@otr.com';
  const existingUser = await userRepository.findOne({ where: { email: userEmail } });
  
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const user = userRepository.create({
      email: userEmail,
      username: 'demo_user',
      password: hashedPassword,
      displayName: 'Demo User',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });
    await userRepository.save(user);
    console.log('✅ Demo user created: demo@otr.com / demo123');
  } else {
    console.log('ℹ️  Demo user already exists');
  }

  // Seed Genres
  const genres = [
    { name: 'Electronic', slug: 'electronic', description: 'Electronic dance music and synth-based sounds', color: '#3b82f6' },
    { name: 'Hip-Hop', slug: 'hip-hop', description: 'Rap, beats, and urban music culture', color: '#ef4444' },
    { name: 'House', slug: 'house', description: 'Four-on-the-floor beats and groovy basslines', color: '#22c55e' },
    { name: 'Techno', slug: 'techno', description: 'Dark, repetitive beats from the underground', color: '#1a1a1a' },
    { name: 'Ambient', slug: 'ambient', description: 'Atmospheric soundscapes and textures', color: '#06b6d4' },
    { name: 'Jazz', slug: 'jazz', description: 'Improvisation and sophisticated harmonies', color: '#f59e0b' },
    { name: 'Soul', slug: 'soul', description: 'Emotional vocals and R&B influences', color: '#8b5cf6' },
    { name: 'Funk', slug: 'funk', description: 'Groovy rhythms and syncopated bass', color: '#ec4899' },
    { name: 'Disco', slug: 'disco', description: 'Classic disco and nu-disco vibes', color: '#f97316' },
    { name: 'Experimental', slug: 'experimental', description: 'Avant-garde and boundary-pushing sounds', color: '#6366f1' },
    { name: 'Drum & Bass', slug: 'drum-bass', description: 'Fast breakbeats and heavy bass', color: '#14b8a6' },
    { name: 'Dub', slug: 'dub', description: 'Heavy bass, reverb and echo effects', color: '#84cc16' },
    { name: 'World', slug: 'world', description: 'Global sounds and cultural fusion', color: '#0ea5e9' },
    { name: 'R&B', slug: 'rnb', description: 'Rhythm and blues with contemporary vibes', color: '#a855f7' },
    { name: 'Reggae', slug: 'reggae', description: 'Island rhythms and positive vibrations', color: '#16a34a' },
    { name: 'Lo-Fi', slug: 'lo-fi', description: 'Chill beats and nostalgic aesthetics', color: '#78716c' },
    { name: 'Indie', slug: 'indie', description: 'Independent and alternative sounds', color: '#dc2626' },
  ];

  for (const genreData of genres) {
    const existing = await genreRepository.findOne({ where: { slug: genreData.slug } });
    if (!existing) {
      const genre = genreRepository.create({ ...genreData, isActive: true });
      await genreRepository.save(genre);
    }
  }
  console.log(`✅ ${genres.length} genres seeded`);

  // Seed Moods
  const moods = [
    { name: 'Chill', slug: 'chill', description: 'Relaxing vibes for unwinding', color: '#06b6d4' },
    { name: 'Energetic', slug: 'energetic', description: 'High energy to get you moving', color: '#ef4444' },
    { name: 'Melancholic', slug: 'melancholic', description: 'Emotional and introspective', color: '#6366f1' },
    { name: 'Uplifting', slug: 'uplifting', description: 'Positive and mood-boosting', color: '#f59e0b' },
    { name: 'Dark', slug: 'dark', description: 'Mysterious and intense atmosphere', color: '#1e293b' },
    { name: 'Dreamy', slug: 'dreamy', description: 'Ethereal and atmospheric', color: '#a855f7' },
    { name: 'Groovy', slug: 'groovy', description: 'Makes you want to dance', color: '#22c55e' },
    { name: 'Focused', slug: 'focused', description: 'Perfect for concentration', color: '#3b82f6' },
    { name: 'Nostalgic', slug: 'nostalgic', description: 'Takes you back in time', color: '#f97316' },
    { name: 'Romantic', slug: 'romantic', description: 'Love and intimate moments', color: '#ec4899' },
    { name: 'Late Night', slug: 'late-night', description: 'For those midnight sessions', color: '#0f172a' },
    { name: 'Morning', slug: 'morning', description: 'Start your day right', color: '#fbbf24' },
    { name: 'Party', slug: 'party', description: 'Get the party started', color: '#f43f5e' },
    { name: 'Workout', slug: 'workout', description: 'Pump up your exercise', color: '#10b981' },
    { name: 'Peaceful', slug: 'peaceful', description: 'Calm and serene atmosphere', color: '#5eead4' },
    { name: 'Hypnotic', slug: 'hypnotic', description: 'Repetitive and trance-inducing', color: '#7c3aed' },
  ];

  for (const moodData of moods) {
    const existing = await moodRepository.findOne({ where: { slug: moodData.slug } });
    if (!existing) {
      const mood = moodRepository.create({ ...moodData, isActive: true });
      await moodRepository.save(mood);
    }
  }
  console.log(`✅ ${moods.length} moods seeded`);

  console.log('🎉 Database seeding completed!');
  console.log('\n📋 Login Credentials:');
  console.log('   Admin:   admin@otr.com / admin123');
  console.log('   Creator: creator@otr.com / creator123');
  console.log('   User:    demo@otr.com / demo123');

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});

