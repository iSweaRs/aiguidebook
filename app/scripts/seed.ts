import mongoose from 'mongoose';
import { User, Course, Conversation, Message, ConversationCategory, Role } from '../lib/db/models';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-guidebook';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB. Clearing old data...');

    await User.deleteMany({});
    await Course.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});

    // 1. Create Mock User
    const user = await User.create({
      name: 'Jane Doe',
      email: 'jane.doe@university.edu',
    });

    // 2. Create Mock Courses
    const cs101 = await Course.create({ name: 'Intro to Computer Science', code: 'CS101', userId: user._id });
    const ethics202 = await Course.create({ name: 'AI Ethics & Law', code: 'PHI202', userId: user._id });

    // 3. Create Time-stamped Conversations (to test Chronological Sorting)
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const conversations = await Conversation.insertMany([
      {
        title: 'Binary Trees Explanation',
        category: ConversationCategory.ACADEMIC,
        courseId: cs101._id,
        userId: user._id,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo, // Oldest
      },
      {
        title: 'Utilitarianism vs Deontology',
        category: ConversationCategory.ACADEMIC,
        courseId: ethics202._id,
        userId: user._id,
        createdAt: oneHourAgo,
        updatedAt: oneHourAgo, // Middle
      },
      {
        title: 'Drafting my roommate agreement',
        category: ConversationCategory.PRIVATE,
        userId: user._id,
        createdAt: fiveMinutesAgo,
        updatedAt: fiveMinutesAgo, // Most Recent
      },
    ]);

    // 4. Create Mock Messages for the most recent conversation
    await Message.create({
      conversationId: conversations[2]._id,
      role: Role.USER,
      content: 'Can you help me draft a polite roommate agreement?',
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();