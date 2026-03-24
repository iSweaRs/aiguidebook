// __tests__/FeedbackModal.test.tsx
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeedbackModal from '../app/components/FeedbackModal';
import * as actions from '../app/dashboard/actions';

jest.mock('../app/dashboard/actions', () => ({
  submitUserFeedback: jest.fn(),
  getUserFeedback: jest.fn(),
}));

describe('FeedbackModal Component', () => {
  beforeEach(() => {
    // CHANGED: resetAllMocks wipes any lingering mock responses from failed tests!
    jest.resetAllMocks(); 
  });

  it('opens and closes the modal', () => {
    render(<FeedbackModal userId="user-1" />);
    fireEvent.click(screen.getByText('Submit Feedback'));
    expect(screen.getByText('Application Feedback')).toBeInTheDocument();

    const closeBtn = screen.getByText('Application Feedback').nextSibling as HTMLButtonElement;
    fireEvent.click(closeBtn);
    expect(screen.queryByText('Application Feedback')).not.toBeInTheDocument();
  });

  it('disables submit button until rating and text are provided', () => {
    render(<FeedbackModal userId="user-1" />);
    // Note: Since the modal is closed initially, there is only one "Submit Feedback" button, so this works perfectly.
    fireEvent.click(screen.getByText('Submit Feedback')); 

    // CHANGED: Specifically target the form button using its type="submit" attribute
    const submitBtn = screen.getByText('Submit Feedback', { selector: 'button[type="submit"]' });
    expect(submitBtn).toBeDisabled();

    // Add text, still disabled (rating 0)
    const textarea = screen.getByPlaceholderText(/What do you like/i);
    fireEvent.change(textarea, { target: { value: 'Great app!' } });
    expect(submitBtn).toBeDisabled();

    // Add rating
    const starButtons = document.querySelectorAll('button[type="button"]');
    fireEvent.click(starButtons[2]); // 3 stars
    
    expect(submitBtn).not.toBeDisabled();
  });

  it('submits feedback successfully and switches to history tab', async () => {
    (actions.getUserFeedback as jest.Mock).mockResolvedValueOnce([]); 
    
    render(<FeedbackModal userId="user-1" />);
    fireEvent.click(screen.getByText('Submit Feedback'));
    
    fireEvent.change(screen.getByPlaceholderText(/What do you like/i), { target: { value: 'Great app!' } });
    fireEvent.click(document.querySelectorAll('button[type="button"]')[4]); 
    
    // CHANGED: Use the same selector fix here to bypass the multiple elements error
    fireEvent.click(screen.getByText('Submit Feedback', { selector: 'button[type="submit"]' }));

    await waitFor(() => {
      expect(actions.submitUserFeedback).toHaveBeenCalledWith('user-1', 'Great app!', 5);
      expect(screen.getByText(/You haven't submitted any feedback yet/i)).toBeInTheDocument(); 
    });
  });

  it('fetches and displays history correctly', async () => {
    (actions.getUserFeedback as jest.Mock).mockResolvedValueOnce([
      { id: '1', content: 'Past feedback', rating: 4, createdAt: new Date().toISOString() }
    ]);

    render(<FeedbackModal userId="user-1" />);
    fireEvent.click(screen.getByText('Submit Feedback'));
    
    fireEvent.click(screen.getByText(/My Past Feedback/i));

    expect(screen.getByText('Loading your past feedback...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Past feedback')).toBeInTheDocument();
      expect(actions.getUserFeedback).toHaveBeenCalledWith('user-1');
    });
  });
});