import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInput from '../app/components/ChatInput';
import '@testing-library/jest-dom';

// Mock the server actions
jest.mock('../app/dashboard/actions', () => ({
  sendChatMessage: jest.fn(),
  sendBrainstormMessage: jest.fn(),
}));

describe('ChatInput Component', () => {
  it('TC-07: triggers PII warning when typing a phone number', async () => {
    render(<ChatInput conversationId="123" />);
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');

    await userEvent.type(input, 'Call me at 555-019-9999');
    fireEvent.click(sendButton);

    // Branch coverage: Assert the modal blocks the send action
    expect(screen.getByText('Privacy Warning')).toBeInTheDocument();
  });

  it('TC-09: shows document upload warning before uploading', () => {
    render(<ChatInput conversationId="123" />);
    const plusButton = screen.getByTitle('Upload Document');
    
    fireEvent.click(plusButton);
    
    expect(screen.getByText(/Warning: Possibly sensitive information/i)).toBeInTheDocument();
  });
});