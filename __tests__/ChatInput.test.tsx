// __tests__/ChatInput.test.tsx
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatInput from '../app/components/ChatInput';
import * as actions from '../app/dashboard/actions';

// Mock the server actions
jest.mock('../app/dashboard/actions', () => ({
  sendChatMessage: jest.fn(),
  uploadDocument: jest.fn(),
  sendBrainstormMessage: jest.fn(),
}));

describe('ChatInput Component', () => {
  const mockConversationId = 'convo-123';
  const mockToggleBrainstorm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- PII Detection & Submissions ---
  it('should not submit if input is empty or whitespace', async () => {
    render(<ChatInput conversationId={mockConversationId} />);
    const submitButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.click(submitButton);
    expect(actions.sendChatMessage).not.toHaveBeenCalled();
  });

  it('should submit normal text correctly', async () => {
    render(<ChatInput conversationId={mockConversationId} />);
    const input = screen.getByPlaceholderText(/type your message/i);
    const form = input.closest('form');

    fireEvent.change(input, { target: { value: 'Hello world' } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(actions.sendChatMessage).toHaveBeenCalledWith(mockConversationId, 'Hello world', 'user');
    });
  });

  it('should call sendBrainstormMessage if isBrainstorming is true', async () => {
    render(<ChatInput conversationId={mockConversationId} isBrainstorming={true} />);
    const input = screen.getByPlaceholderText(/brainstorm your ideas/i);
    const form = input.closest('form');

    fireEvent.change(input, { target: { value: 'A great idea' } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(actions.sendBrainstormMessage).toHaveBeenCalledWith(mockConversationId, 'A great idea');
    });
  });

  it('should intercept submission with PII modal for emails', () => {
    render(<ChatInput conversationId={mockConversationId} />);
    const input = screen.getByPlaceholderText(/type your message/i);
    const form = input.closest('form');

    fireEvent.change(input, { target: { value: 'My email is test@example.com' } });
    fireEvent.submit(form!);

    // Action should not be called yet
    expect(actions.sendChatMessage).not.toHaveBeenCalled();
    // Modal should appear
    expect(screen.getByText(/Privacy Warning/i)).toBeInTheDocument();
  });

  it('should intercept submission with PII modal for phone numbers', () => {
    render(<ChatInput conversationId={mockConversationId} />);
    const input = screen.getByPlaceholderText(/type your message/i);
    
    fireEvent.change(input, { target: { value: 'Call me at (123) 456-7890' } });
    fireEvent.submit(input.closest('form')!);

    expect(screen.getByText(/Privacy Warning/i)).toBeInTheDocument();
  });

  it('should cancel sending when PII modal cancel is clicked', () => {
    render(<ChatInput conversationId={mockConversationId} />);
    fireEvent.change(screen.getByPlaceholderText(/type your message/i), { target: { value: 'test@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /send/i }));

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    
    expect(screen.queryByText(/Privacy Warning/i)).not.toBeInTheDocument();
    expect(actions.sendChatMessage).not.toHaveBeenCalled();
  });

  it('should force send when PII modal confirm is clicked', async () => {
    render(<ChatInput conversationId={mockConversationId} />);
    fireEvent.change(screen.getByPlaceholderText(/type your message/i), { target: { value: 'test@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /send/i }));

    fireEvent.click(screen.getByRole('button', { name: /yes, send/i }));
    
    await waitFor(() => {
      expect(actions.sendChatMessage).toHaveBeenCalledWith(mockConversationId, 'test@example.com', 'user');
    });
  });

  // --- Document Upload Flow ---
  it('should toggle document upload warning', () => {
    render(<ChatInput conversationId={mockConversationId} />);
    const uploadBtn = screen.getByTitle('Upload Document');
    
    fireEvent.click(uploadBtn);
    expect(screen.getByText(/Warning: Possibly sensitive information/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText(/Warning: Possibly sensitive information/i)).not.toBeInTheDocument();
  });

  it('should trigger file upload when document warning is confirmed', async () => {
    render(<ChatInput conversationId={mockConversationId} />);
    fireEvent.click(screen.getByTitle('Upload Document'));
    
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Upload/i });
    
    // Create a mock file
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Simulate user selecting a file
    Object.defineProperty(fileInput, 'files', { value: [file] });
    
    fireEvent.click(confirmBtn); // confirm modal
    fireEvent.change(fileInput); // trigger file change

    await waitFor(() => {
      expect(actions.uploadDocument).toHaveBeenCalled();
    });
  });

  // --- Toggles ---
  it('should call onToggleBrainstorm when lightbulb is clicked', () => {
    render(<ChatInput conversationId={mockConversationId} onToggleBrainstorm={mockToggleBrainstorm} />);
    const toggleBtn = screen.getByTitle('Switch to Brainstorming Mode');
    fireEvent.click(toggleBtn);
    expect(mockToggleBrainstorm).toHaveBeenCalledTimes(1);
  });
});