'use server';
import connectDB from '../lib/db/mongodb';
import mongoose from 'mongoose';
import { Conversation, Course, ConversationCategory } from '../lib/db/models';


export type GroupedConversations = {
  academic: {
    course: { _id: string; name: string; code: string };
    conversations: Array<{ _id: string; title: string; updatedAt: Date }>;
  }[];
  private: Array<{ _id: string; title: string; updatedAt: Date }>;
};

/**
 * REQ-01: Fetches conversations grouped by Private / Academic (and Sub-Courses).
 * Sorts all channels chronologically by `updatedAt` DESC.
 */
export async function getDashboardConversations(userId: string): Promise<GroupedConversations> {
  await connectDB();
  console.log(`[DB DEBUG] Fetching conversations for User ID: ${userId}`); 
  // 1. Fetch Private Conversations (Sorted chronologically)
  const privateConvos = await Conversation.find({
    userId,
    category: ConversationCategory.PRIVATE,
  })
    .sort({ updatedAt: -1 })
    .select('_id title updatedAt')
    .lean();

    console.log(`[DB DEBUG] Found ${privateConvos.length} private conversations.`); //
  // 2. Fetch Academic Conversations with Populated Course details (Sorted chronologically)
  const academicConvos = await Conversation.find({
    userId,
    category: ConversationCategory.ACADEMIC,
  })
    .sort({ updatedAt: -1 })
    .populate('courseId', '_id name code')
    .select('_id title updatedAt courseId')
    .lean();

    console.log(`[DB DEBUG] Found ${academicConvos.length} academic conversations.`);
  // 3. Group Academic Conversations by Course
  const courseMap = new Map<string, any>();
  
  for (const convo of academicConvos) {
    const course = convo.courseId as any;
    if (!course) continue;

    if (!courseMap.has(course._id.toString())) {
      courseMap.set(course._id.toString(), {
        course: { _id: course._id.toString(), name: course.name, code: course.code },
        conversations: [],
      });
    }
    courseMap.get(course._id.toString()).conversations.push({
      _id: convo._id.toString(),
      title: convo.title,
      updatedAt: convo.updatedAt?.toISOString(),
    });
  }
  
  return {
    academic: Array.from(courseMap.values()),
    private: privateConvos.map((c: any) => ({
      _id: c._id.toString(),
      title: c.title,
      updatedAt: c.updatedAt.toISOString(),
    })),
  };
}

import { Message } from '../lib/db/models';

export async function getConversationMessages(conversationId: string) {
  await connectDB();  
  const messages = await Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .lean();
  return messages.map((m: any) => ({
    _id: m._id.toString(),
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));
}

// app/dashboard/actions.ts
import { revalidatePath } from 'next/cache'; //
// ... existing imports

export async function sendChatMessage(conversationId: string, content: string, role: string) {
  await connectDB(); //

  // 1. Create the new message
  const newMessage = await Message.create({
    conversationId: new mongoose.Types.ObjectId(conversationId),
    role,
    content,
  });

  // 2. Update the conversation's updatedAt timestamp for sorting
  await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() });

  // 3. Refresh the page data
  revalidatePath(`/dashboard/chat/${conversationId}`);

  return {
    _id: newMessage._id.toString(),
    role: newMessage.role,
    content: newMessage.content,
    createdAt: newMessage.createdAt.toISOString(),
  };
}