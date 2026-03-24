import { getDashboardConversations, submitUserFeedback } from '../app/dashboard/actions';
import { Conversation, Course, Feedback } from '../app/lib/db/models';

// Mock dependencies
jest.mock('../app/lib/db/mongodb', () => jest.fn());
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('../app/lib/db/models', () => ({
  Conversation: { find: jest.fn() },
  Course: { find: jest.fn() },
  Feedback: { create: jest.fn() }
}));

describe('Server Actions', () => {
  it('TC-10/11: successfully submits user feedback', async () => {
    (Feedback.create as jest.Mock).mockResolvedValueOnce({});
    
    const result = await submitUserFeedback('user123', 'Great app!', 5);
    
    expect(Feedback.create).toHaveBeenCalledWith({
      userId: expect.anything(),
      content: 'Great app!',
      rating: 5
    });
    expect(result.success).toBe(true);
  });
});