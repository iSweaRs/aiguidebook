// __tests__/actions.test.ts
import '@testing-library/jest-dom';
import * as actions from '../app/dashboard/actions';
import connectDB from '../app/lib/db/mongodb';
import mongoose from 'mongoose';
import { Conversation, Course, Message, DocumentFile, BrainstormIdea, BiasReport, Feedback } from '../app/lib/db/models';
import { revalidatePath } from 'next/cache';

// Mock dependencies
jest.mock('../app/lib/db/mongodb', () => jest.fn());
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

// Mongoose mock setup
jest.mock('../app/lib/db/models', () => ({
  Course: { find: jest.fn(), create: jest.fn(), findByIdAndDelete: jest.fn() },
  Conversation: { find: jest.fn(), findByIdAndUpdate: jest.fn(), create: jest.fn(), deleteMany: jest.fn(), findByIdAndDelete: jest.fn() },
  Message: { find: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
  DocumentFile: { create: jest.fn() },
  BrainstormIdea: { find: jest.fn(), create: jest.fn() },
  BiasReport: { find: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
  Feedback: { find: jest.fn(), create: jest.fn() },
  ConversationCategory: { PRIVATE: 'PRIVATE', ACADEMIC: 'ACADEMIC' } 
}));

describe('Server Actions', () => {
  // Valid 24-character hex strings for Mongoose ObjectIds
  const USER_ID = '507f1f77bcf86cd799439000';
  const COURSE_ID = '507f1f77bcf86cd799439001';
  const CONVO_ID_1 = '507f1f77bcf86cd799439011';
  const CONVO_ID_2 = '507f1f77bcf86cd799439012';
  const MSG_ID_1 = '507f1f77bcf86cd799439013';
  const MSG_ID_2 = '507f1f77bcf86cd799439014';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- EXISTING TESTS (getDashboardConversations, sendChatMessage, deleteCourse, etc.) ---

  it('getDashboardConversations groups correctly', async () => {
    const mockCourses = [{ _id: COURSE_ID, name: 'Test Course', code: 'TC101' }];
    const mockAcademic = [{ _id: CONVO_ID_1, title: 'Ac', courseId: COURSE_ID, updatedAt: new Date() }];
    const mockPrivate = [{ _id: CONVO_ID_2, title: 'Pr', updatedAt: new Date() }];

    (Course.find as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(mockCourses) });
    (Conversation.find as jest.Mock)
      .mockReturnValueOnce({ sort: () => ({ lean: jest.fn().mockResolvedValue(mockPrivate) }) }) 
      .mockReturnValueOnce({ sort: () => ({ lean: jest.fn().mockResolvedValue(mockAcademic) }) }); 

    const result = await actions.getDashboardConversations(USER_ID);

    expect(connectDB).toHaveBeenCalled();
    expect(result.private).toHaveLength(1);
    expect(result.academic).toHaveLength(1);
    expect(result.academic[0].course.code).toBe('TC101');
  });

  it('sendChatMessage creates a message and revalidates', async () => {
    (Message.create as jest.Mock).mockResolvedValue({ _id: MSG_ID_1, role: 'user', content: 'hi', createdAt: new Date() });
    await actions.sendChatMessage(CONVO_ID_1, 'hi', 'user');
    expect(Message.create).toHaveBeenCalled();
    expect(Conversation.findByIdAndUpdate).toHaveBeenCalledWith(CONVO_ID_1, expect.any(Object));
    expect(revalidatePath).toHaveBeenCalledWith(`/dashboard/chat/${CONVO_ID_1}`);
  });

  it('uploadDocument creates a document and a message', async () => {
    const mockFormData = {
      get: jest.fn().mockReturnValue({
        name: 'test.txt',
        type: 'text/plain',
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
      })
    } as unknown as FormData;

    await actions.uploadDocument(CONVO_ID_1, mockFormData);

    expect(DocumentFile.create).toHaveBeenCalled();
    expect(Message.create).toHaveBeenCalledWith(expect.objectContaining({ content: '📎 Uploaded document: test.txt' }));
    expect(revalidatePath).toHaveBeenCalled();
  });

  it('uploadDocument throws if no file is found', async () => {
    const emptyFormData = { get: jest.fn().mockReturnValue(null) } as unknown as FormData;
    await expect(actions.uploadDocument(CONVO_ID_1, emptyFormData)).rejects.toThrow('No file uploaded');
  });

  it('deleteCourse cascades deletions correctly', async () => {
    (Conversation.find as jest.Mock).mockResolvedValue([{ _id: CONVO_ID_1 }]);
    await actions.deleteCourse(COURSE_ID);
    expect(Message.deleteMany).toHaveBeenCalledWith({ conversationId: CONVO_ID_1 });
    expect(Conversation.deleteMany).toHaveBeenCalled();
    expect(Course.findByIdAndDelete).toHaveBeenCalledWith(COURSE_ID);
  });


  // --- NEW TESTS TO REACH 100% COVERAGE ---

  it('getConversationMessages retrieves messages and maps bias flags', async () => {
    const mockMessages = [
      { _id: MSG_ID_1, role: 'user', content: 'Hello', createdAt: new Date() },
      { _id: MSG_ID_2, role: 'assistant', content: 'Hi there', createdAt: new Date() }
    ];
    // Mock message fetch
    (Message.find as jest.Mock).mockReturnValue({ sort: () => ({ lean: jest.fn().mockResolvedValue(mockMessages) }) });
    
    // Mock that the 2nd message has been reported for bias
    (BiasReport.find as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue([{ messageId: MSG_ID_2 }]) });

    const result = await actions.getConversationMessages(CONVO_ID_1);

    expect(result).toHaveLength(2);
    expect(result[0].isFlagged).toBe(false); // MSG_ID_1 was not reported
    expect(result[1].isFlagged).toBe(true);  // MSG_ID_2 was reported
  });

  it('createConversation creates a new conversation', async () => {
    (Conversation.create as jest.Mock).mockResolvedValue({ _id: CONVO_ID_1 });

    const result = await actions.createConversation(USER_ID, 'ACADEMIC', COURSE_ID);

    expect(Conversation.create).toHaveBeenCalledWith({
      userId: expect.any(mongoose.Types.ObjectId),
      category: 'ACADEMIC',
      courseId: expect.any(mongoose.Types.ObjectId),
      title: 'New Conversation',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
    expect(result._id).toBe(CONVO_ID_1);
  });

  it('getCourses fetches and maps courses', async () => {
    const mockCourses = [{ _id: COURSE_ID, name: 'Math', code: 'M101' }];
    (Course.find as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(mockCourses) });

    const result = await actions.getCourses(USER_ID);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ _id: COURSE_ID, name: 'Math', code: 'M101' });
  });

  it('renameConversation updates title', async () => {
    await actions.renameConversation(CONVO_ID_1, 'Updated Title');
    expect(Conversation.findByIdAndUpdate).toHaveBeenCalledWith(CONVO_ID_1, { title: 'Updated Title' });
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });

  it('createCourse creates a new course', async () => {
    (Course.create as jest.Mock).mockResolvedValue({ _id: COURSE_ID });
    const result = await actions.createCourse(USER_ID, 'Physics', 'PHY101');
    
    expect(Course.create).toHaveBeenCalledWith({
      userId: expect.any(mongoose.Types.ObjectId),
      name: 'Physics',
      code: 'PHY101'
    });
    expect(result._id).toBe(COURSE_ID);
  });

  it('deleteConversation cascades deletions correctly', async () => {
    await actions.deleteConversation(CONVO_ID_1);
    expect(Message.deleteMany).toHaveBeenCalledWith({ conversationId: expect.any(mongoose.Types.ObjectId) });
    expect(Conversation.findByIdAndDelete).toHaveBeenCalledWith(CONVO_ID_1);
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });

  it('getBrainstormIdeas fetches and maps ideas', async () => {
    const mockIdeas = [{ _id: 'idea1', prompt: 'test', idea: 'result', createdAt: new Date() }];
    (BrainstormIdea.find as jest.Mock).mockReturnValue({ sort: () => ({ lean: jest.fn().mockResolvedValue(mockIdeas) }) });

    const result = await actions.getBrainstormIdeas(CONVO_ID_1);
    expect(result).toHaveLength(1);
    expect(result[0].prompt).toBe('test');
  });

  it('sendBrainstormMessage generates idea and saves to databases', async () => {
    await actions.sendBrainstormMessage(CONVO_ID_1, 'Help me think of an idea');
    
    // Checks that user message, AI message, and Idea were all created
    expect(Message.create).toHaveBeenCalledTimes(2); 
    expect(BrainstormIdea.create).toHaveBeenCalled();
    expect(Conversation.findByIdAndUpdate).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith(`/dashboard/chat/${CONVO_ID_1}`);
  });

  it('reportMessageBias creates a report', async () => {
    const result = await actions.reportMessageBias(MSG_ID_1);
    expect(BiasReport.create).toHaveBeenCalledWith({ messageId: expect.any(mongoose.Types.ObjectId) });
    expect(result.success).toBe(true);
  });

  it('removeMessageBiasReport deletes a report', async () => {
    const result = await actions.removeMessageBiasReport(MSG_ID_1);
    expect(BiasReport.deleteMany).toHaveBeenCalledWith({ messageId: expect.any(mongoose.Types.ObjectId) });
    expect(result.success).toBe(true);
  });

  it('submitUserFeedback saves feedback', async () => {
    const result = await actions.submitUserFeedback(USER_ID, 'Great app', 5);
    expect(Feedback.create).toHaveBeenCalledWith({
      userId: expect.any(mongoose.Types.ObjectId),
      content: 'Great app',
      rating: 5
    });
    expect(result.success).toBe(true);
  });

  it('getUserFeedback retrieves sorted user feedback', async () => {
    const mockFeedback = [{ _id: 'f1', content: 'Nice', rating: 4, createdAt: new Date() }];
    (Feedback.find as jest.Mock).mockReturnValue({ sort: () => ({ lean: jest.fn().mockResolvedValue(mockFeedback) }) });

    const result = await actions.getUserFeedback(USER_ID);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('Nice');
    expect(Feedback.find).toHaveBeenCalledWith({ userId: expect.any(mongoose.Types.ObjectId) });
  });
});