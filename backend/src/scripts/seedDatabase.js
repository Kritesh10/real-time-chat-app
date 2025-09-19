// backend/src/scripts/seedDatabase.js
const { testConnection } = require('../config/database');
const { syncDatabase } = require('../models');
const databaseService = require('../services/databaseService');

const testUsers = [
  {
    username: 'alice',
    email: 'alice@test.com',
    password: 'password123',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice'
  },
  {
    username: 'bob',
    email: 'bob@test.com',
    password: 'password123',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'
  },
  {
    username: 'charlie',
    email: 'charlie@test.com',
    password: 'password123',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie'
  },
  {
    username: 'diana',
    email: 'diana@test.com',
    password: 'password123',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana'
  },
  {
    username: 'eve',
    email: 'eve@test.com',
    password: 'password123',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await testConnection();
    
    // Sync database (recreate tables)
    console.log('🔄 Syncing database...');
    await syncDatabase(true); // force: true will drop and recreate tables
    
    // Create test users
    console.log('👥 Creating test users...');
    const createdUsers = [];
    
    for (const userData of testUsers) {
      try {
        const user = await databaseService.createUser(userData);
        createdUsers.push(user);
        console.log(`✅ Created user: ${user.username} (ID: ${user.id})`);
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.username}:`, error.message);
      }
    }
    
    // Create some sample messages
    console.log('💬 Creating sample messages...');
    const sampleMessages = [
      {
        userId: 1,
        roomId: 'general',
        message: 'Hello everyone! 👋'
      },
      {
        userId: 2,
        roomId: 'general',
        message: 'Hey Alice! How are you doing?'
      },
      {
        userId: 3,
        roomId: 'general',
        message: 'Good morning! Beautiful day today ☀️'
      },
      {
        userId: 1,
        roomId: 'general',
        message: 'I\'m doing great, thanks Bob! How about you?'
      },
      {
        userId: 4,
        roomId: 'general',
        message: 'Just joined the chat! Excited to be here 🎉'
      },
      {
        userId: 2,
        roomId: 'developers',
        message: 'Anyone working on Node.js here?'
      },
      {
        userId: 3,
        roomId: 'developers',
        message: 'Yes! Building a chat app actually ��'
      },
      {
        userId: 5,
        roomId: 'random',
        message: 'This is a test message in the random room'
      }
    ];
    
    for (const messageData of sampleMessages) {
      try {
        const message = await databaseService.createMessage(messageData);
        console.log(`✅ Created message: "${message.message}" by user ${message.user.username}`);
      } catch (error) {
        console.error('❌ Failed to create message:', error.message);
      }
    }
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users created: ${createdUsers.length}`);
    console.log(`💬 Sample messages created: ${sampleMessages.length}`);
    console.log('\n🚀 You can now test the chat application with these users:');
    createdUsers.forEach(user => {
      console.log(`   - ${user.username} (ID: ${user.id})`);
    });
    console.log('\n🔐 All users have password: password123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the seeder
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
