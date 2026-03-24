// __tests__/ChatMessages.test.tsx
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatMessages from '../app/components/ChatMessages';
import * as actions from '../app/dashboard/actions';

jest.mock('../app/dashboard/actions', () => ({
  reportMessageBias: jest.fn(),
  removeMessageBiasReport: jest.fn(),
}));

describe('ChatMessages Component', () => {
  const mockMessages = [
    { _id: '1', role: 'user', content: 'Hello AI', createdAt: new Date().toISOString(), isFlagged: false },
    { _id: '2', role: 'assistant', content: 'Hello User', createdAt: new Date().toISOString(), isFlagged: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock scroll into view behavior
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  it('renders messages correctly', () => {
    render(<ChatMessages messages={mockMessages} />);
    expect(screen.getByText('Hello AI')).toBeInTheDocument();
    expect(screen.getByText('Hello User')).toBeInTheDocument();
  });

  it('shows flag button only on assistant messages', () => {
    render(<ChatMessages messages={mockMessages} />);
    // There are 2 messages, but only 1 is assistant. Therefore, only 1 flag button.
    const flagButtons = screen.getAllByRole('button');
    expect(flagButtons).toHaveLength(1); 
  });

  it('opens and cancels the report bias modal', () => {
    // Pass an unflagged assistant message
    render(<ChatMessages messages={[{ _id: '3', role: 'assistant', content: 'Test', createdAt: new Date().toISOString(), isFlagged: false }]} />);
    
    fireEvent.click(screen.getByRole('button')); // Click flag
    expect(screen.getByText('Report Response')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Report Response')).not.toBeInTheDocument();
    expect(actions.reportMessageBias).not.toHaveBeenCalled();
  });

  it('submits a bias report and updates local state', async () => {
    render(<ChatMessages messages={[{ _id: '4', role: 'assistant', content: 'Test', createdAt: new Date().toISOString(), isFlagged: false }]} />);
    
    fireEvent.click(screen.getByRole('button')); // Click flag
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Report' }));

    await waitFor(() => {
      expect(actions.reportMessageBias).toHaveBeenCalledWith('4');
    });
  });

it('removes a bias report for an already flagged message', async () => {
    render(<ChatMessages messages={[{ _id: '5', role: 'assistant', content: 'Flagged', createdAt: new Date().toISOString(), isFlagged: true }]} />);
    
    // 1. Click the flag icon. Since the modal isn't open yet, this is the only button on the screen.
    fireEvent.click(screen.getByRole('button'));
    
    // 2. Verify the modal title. Using 'heading' ensures we only target the <h3>.
    expect(screen.getByRole('heading', { name: 'Remove Report' })).toBeInTheDocument();

    // 3. Click the modal's submit button. 
    // getByText looks specifically at INNER TEXT, not attributes like 'title'. 
    // This perfectly ignores the flag icon button and the { selector: 'button' } ignores the <h3>.
    fireEvent.click(screen.getByText('Remove Report', { selector: 'button' })); 

    await waitFor(() => {
      expect(actions.removeMessageBiasReport).toHaveBeenCalledWith('5');
    });
  });
});