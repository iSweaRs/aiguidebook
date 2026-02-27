// app/scripts/seed.ts
import mongoose from 'mongoose';
import { User, Course, Conversation, Message, ConversationCategory, Role, BrainstormIdea } from '../lib/db/models';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-guidebook';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB. Clearing old data...');

    await User.deleteMany({});
    await Course.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    await BrainstormIdea.deleteMany({}); // Clear the new brainstorm collection

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
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

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
        title: 'Hackathon Project Ideas', // Updated title for the brainstorming example
        category: ConversationCategory.PRIVATE,
        userId: user._id,
        createdAt: tenMinutesAgo,
        updatedAt: now, // Most Recent
      },
    ]);

    const hackathonConvoId = conversations[2]._id;

    // 4. NORMAL MODE: Initial conversation setup
    await Message.create({
      conversationId: hackathonConvoId,
      role: Role.USER,
      content: 'Hi! I am participating in a hackathon this weekend. The theme is "Accessible Education". Can we discuss some ideas?',
      createdAt: new Date(now.getTime() - 8 * 60 * 1000), // 8 mins ago
    });

    await Message.create({
      conversationId: hackathonConvoId,
      role: Role.ASSISTANT,
      content: 'That sounds exciting! "Accessible Education" is a broad and impactful theme. Would you like to start by brainstorming some general concepts?',
      createdAt: new Date(now.getTime() - 7.5 * 60 * 1000),
    });

    // 5. BRAINSTORMING MODE: Idea 1
    const prompt1 = 'Give me ideas for a mobile app.';
    const idea1 = 'An app that matches volunteer tutors with students in underfunded schools using a simple, swipe-based interface. It could include built-in translation features to cross language barriers.';
    
    // Save to Messages
    await Message.create([
      { conversationId: hackathonConvoId, role: Role.USER, content: prompt1, createdAt: new Date(now.getTime() - 6 * 60 * 1000) },
      { conversationId: hackathonConvoId, role: Role.ASSISTANT, content: idea1, createdAt: new Date(now.getTime() - 5.8 * 60 * 1000) }
    ]);
    // Save to Brainstorm Logs
    await BrainstormIdea.create({
      conversationId: hackathonConvoId,
      prompt: prompt1,
      idea: idea1,
      createdAt: new Date(now.getTime() - 5.8 * 60 * 1000),
    });

    // 6. BRAINSTORMING MODE: Idea 2
    const prompt2 = 'What about something using gamification?';
    const idea2 = 'A quest-based learning platform where completing real-world educational challenges (like visiting a local library or finishing a coding module) unlocks digital badges and local community rewards.';

    // Save to Messages
    await Message.create([
      { conversationId: hackathonConvoId, role: Role.USER, content: prompt2, createdAt: new Date(now.getTime() - 4 * 60 * 1000) },
      { conversationId: hackathonConvoId, role: Role.ASSISTANT, content: idea2, createdAt: new Date(now.getTime() - 3.8 * 60 * 1000) }
    ]);
    // Save to Brainstorm Logs
    await BrainstormIdea.create({
      conversationId: hackathonConvoId,
      prompt: prompt2,
      idea: idea2,
      createdAt: new Date(now.getTime() - 3.8 * 60 * 1000),
    });

    // 7. NORMAL MODE: Switching back to normal chat to expand on an idea
    await Message.create({
      conversationId: hackathonConvoId,
      role: Role.USER,
      content: 'I really like the gamification one! Let\'s switch back to normal mode and expand on the core features for that quest-based app.',
      createdAt: new Date(now.getTime() - 2 * 60 * 1000),
    });

    await Message.create({
      conversationId: hackathonConvoId,
      role: Role.ASSISTANT,
      content: 'Great choice! Let\'s flesh it out. Here are some core features we could include:\n1. User Profiles & Avatars\n2. Geolocation check-ins for local quests\n3. Partner dashboard for local businesses to offer rewards\n\nWhich of these should we tackle first?',
      createdAt: now,
    });

    console.log('Database seeded successfully with a full brainstorming simulation!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();