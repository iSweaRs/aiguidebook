'use server';
import connectDB from '../lib/db/mongodb';
import mongoose from 'mongoose';
import { Conversation, Course, ConversationCategory, DocumentFile } from '../lib/db/models';


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
// app/dashboard/actions.ts

export async function getDashboardConversations(userId: string): Promise<GroupedConversations> {
  await connectDB();

  // 1. Récupérer TOUS les cours de l'utilisateur (même sans chat)
  const allCourses = await Course.find({ userId }).lean();

  // 2. Récupérer les conversations privées
  const privateConvos = await Conversation.find({
    userId,
    category: ConversationCategory.PRIVATE,
  })
    .sort({ updatedAt: -1 })
    .lean();

  // 3. Récupérer les conversations académiques
  const academicConvos = await Conversation.find({
    userId,
    category: ConversationCategory.ACADEMIC,
  })
    .sort({ updatedAt: -1 })
    .lean();

  // 4. Initialiser la map avec tous les cours existants
  const courseMap = new Map<string, any>();
  
  for (const course of allCourses) {
    courseMap.set(course._id.toString(), {
      course: { 
        _id: course._id.toString(), 
        name: course.name, 
        code: course.code 
      },
      conversations: [],
    });
  }

  // 5. Distribuer les conversations dans les bons cours
  for (const convo of academicConvos) {
    const courseId = convo.courseId?.toString();
    if (courseId && courseMap.has(courseId)) {
      courseMap.get(courseId).conversations.push({
        _id: convo._id.toString(),
        title: convo.title,
        updatedAt: convo.updatedAt?.toISOString(),
      });
    }
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

import { redirect } from 'next/navigation';

export async function createConversation(userId: string, category: string, courseId?: string) {
  await connectDB();
  
  const newConversation = await Conversation.create({
    userId: new mongoose.Types.ObjectId(userId),
    category: category as ConversationCategory,
    courseId: courseId ? new mongoose.Types.ObjectId(courseId) : undefined,
    title: 'New Conversation',
  });

  revalidatePath('/dashboard');
  
  return {
    _id: newConversation._id.toString(),
  };
}


// Also add this helper to fetch courses for the selection modal
export async function getCourses(userId: string) {
  await connectDB();
  const courses = await Course.find({ userId }).lean();
  return courses.map(c => ({ 
    _id: c._id.toString(), 
    name: c.name, 
    code: c.code 
  }));
}

export async function renameConversation(conversationId: string, newTitle: string) {
  await connectDB();
  await Conversation.findByIdAndUpdate(conversationId, { title: newTitle });
  revalidatePath('/dashboard');
}

export async function createCourse(userId: string, name: string, code: string) {
  await connectDB();
  const newCourse = await Course.create({
    userId: new mongoose.Types.ObjectId(userId),
    name,
    code,
  });
  revalidatePath('/dashboard');
  return { _id: newCourse._id.toString() };
}

export async function deleteConversation(conversationId: string) {
  await connectDB();
  // 1. Delete all messages in the conversation
  await Message.deleteMany({ conversationId: new mongoose.Types.ObjectId(conversationId) });
  // 2. Delete the conversation itself
  await Conversation.findByIdAndDelete(conversationId);
  
  revalidatePath('/dashboard');
}

export async function deleteCourse(courseId: string) {
  await connectDB();
  const convos = await Conversation.find({ courseId: new mongoose.Types.ObjectId(courseId) });
  
  // Delete messages for each conversation in this course
  for (const convo of convos) {
    await Message.deleteMany({ conversationId: convo._id });
  }
  
  // Delete all conversations linked to this course
  await Conversation.deleteMany({ courseId: new mongoose.Types.ObjectId(courseId) });
  // Finally delete the course
  await Course.findByIdAndDelete(courseId);

  revalidatePath('/dashboard');
}

export async function uploadDocument(conversationId: string, formData: FormData) {
  await connectDB();
  
  const file = formData.get('file') as File;
  if (!file) throw new Error('No file uploaded');

  // Convert the uploaded file into a binary Buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Save the document directly into MongoDB
  await DocumentFile.create({
    conversationId: new mongoose.Types.ObjectId(conversationId),
    filename: file.name,
    contentType: file.type,
    data: buffer,
  });

  // Create a message in the chat indicating the user uploaded a file
  await Message.create({
    conversationId: new mongoose.Types.ObjectId(conversationId),
    role: 'user',
    content: `📎 Uploaded document: ${file.name}`,
  });

  // Update the conversation's updatedAt timestamp and refresh the page
  await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() });
  revalidatePath(`/dashboard/chat/${conversationId}`);
}