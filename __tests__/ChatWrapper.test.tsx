// __tests__/ChatWrapper.test.tsx
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatWrapper from '../app/components/ChatWrapper';

// Mock children to isolate wrapper behavior
jest.mock('../app/components/ChatMessages', () => () => <div data-testid="mock-chat-messages" />);
jest.mock('../app/components/ChatInput', () => ({ onToggleBrainstorm }: any) => (
  <button data-testid="mock-toggle" onClick={onToggleBrainstorm}>Toggle</button>
));

describe('ChatWrapper Component', () => {
  const mockIdeas = [
    { id: '1', prompt: 'Idea 1', idea: 'Result 1' },
  ];

  it('renders base layout correctly', () => {
    render(<ChatWrapper conversationId="1" messages={[]} ideas={mockIdeas} />);
    expect(screen.getByTestId('mock-chat-messages')).toBeInTheDocument();
    expect(screen.queryByText('Brainstorming Log')).not.toBeInTheDocument();
  });

  it('toggles the brainstorming sidebar', () => {
    render(<ChatWrapper conversationId="1" messages={[]} ideas={mockIdeas} />);
    
    // Toggle on
    fireEvent.click(screen.getByTestId('mock-toggle'));
    expect(screen.getByText('Brainstorming Log')).toBeInTheDocument();
    expect(screen.getByText('"Idea 1"')).toBeInTheDocument(); // Displays idea

    // Toggle off
    fireEvent.click(screen.getByTestId('mock-toggle'));
    expect(screen.queryByText('Brainstorming Log')).not.toBeInTheDocument();
  });

  it('displays fallback text when ideas list is empty in brainstorm mode', () => {
    render(<ChatWrapper conversationId="1" messages={[]} ideas={[]} />);
    fireEvent.click(screen.getByTestId('mock-toggle')); // Open sidebar
    
    expect(screen.getByText('No ideas generated yet.')).toBeInTheDocument();
  });
});