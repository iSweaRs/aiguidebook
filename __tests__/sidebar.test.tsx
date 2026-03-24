// __tests__/sidebar.test.tsx
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Sidebar from '../app/components/sidebar';
import * as actions from '../app/dashboard/actions';

let mockPathname = '/dashboard';
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('../app/dashboard/actions', () => ({
  getDashboardConversations: jest.fn(),
  createConversation: jest.fn(),
  renameConversation: jest.fn(),
  createCourse: jest.fn(),
  deleteConversation: jest.fn(),
  deleteCourse: jest.fn(),
}));

describe('Sidebar Component', () => {
  const mockData = {
    academic: [
      {
        course: { _id: 'course-1', name: 'Computer Science', code: 'CS101' },
        conversations: [{ _id: 'convo-1', title: 'Math Chat', updatedAt: new Date() }],
      }
    ],
    private: [
      { _id: 'convo-2', title: 'Secret Chat', updatedAt: new Date() }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/dashboard';
    (actions.getDashboardConversations as jest.Mock).mockResolvedValue(mockData);
    window.prompt = jest.fn();
    window.confirm = jest.fn();
  });

  // --- INITIAL RENDER & TABS ---
  it('renders loading state initially, then data', async () => {
    render(<Sidebar userId="user-1" />);
    expect(actions.getDashboardConversations).toHaveBeenCalledWith('user-1');
    
    await waitFor(() => {
      expect(screen.getByText('CS101')).toBeInTheDocument();
      expect(screen.getByText('Math Chat')).toBeInTheDocument();
    });
  });

  it('switches between Academic and Private tabs', async () => {
    render(<Sidebar userId="user-1" />);
    await waitFor(() => screen.getByText('Math Chat'));

    fireEvent.click(screen.getByRole('button', { name: /Private/i }));
    expect(screen.getByText('Secret Chat')).toBeInTheDocument();
    expect(screen.queryByText('Math Chat')).not.toBeInTheDocument();
  });

  // --- CREATION FLOWS ---
  it('opens new chat selector and creates private chat', async () => {
    (actions.createConversation as jest.Mock).mockResolvedValue({ _id: 'new-chat-id' });
    render(<Sidebar userId="user-1" />);
    await waitFor(() => screen.getByText('CS101'));

    fireEvent.click(screen.getByText('New Chat'));
    fireEvent.click(screen.getByText('Private Chat'));

    await waitFor(() => {
      expect(actions.createConversation).toHaveBeenCalledWith('user-1', 'PRIVATE', undefined);
      expect(mockPush).toHaveBeenCalledWith('/dashboard/chat/new-chat-id');
    });
  });

  it('creates an academic chat when course is selected', async () => {
    (actions.createConversation as jest.Mock).mockResolvedValue({ _id: 'new-chat-id' });
    render(<Sidebar userId="user-1" />);
    await waitFor(() => screen.getByText('CS101'));

    fireEvent.click(screen.getByText('New Chat'));
    
    const courseButton = screen.getByRole('button', { name: /CS101/i });
    fireEvent.click(courseButton);

    await waitFor(() => {
      expect(actions.createConversation).toHaveBeenCalledWith('user-1', 'ACADEMIC', 'course-1');
    });
  });

  it('closes the new chat selector when X is clicked', async () => {
    render(<Sidebar userId="user-1" />);
    await waitFor(() => screen.getByText('CS101'));

    fireEvent.click(screen.getByText('New Chat'));
    expect(screen.getByText('Select Type')).toBeInTheDocument();

    const xButton = screen.getAllByRole('button').find(b => b.innerHTML.includes('lucide-x'));
    fireEvent.click(xButton!);

    expect(screen.queryByText('Select Type')).not.toBeInTheDocument();
    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });

  it('handles course creation via prompt', async () => {
    (window.prompt as jest.Mock).mockReturnValueOnce('CS102').mockReturnValueOnce('Physics');
    render(<Sidebar userId="user-1" />);
    await waitFor(() => screen.getByText('CS101'));

    fireEvent.click(screen.getByText('New Chat'));
    fireEvent.click(screen.getByText('+ Add Course'));

    await waitFor(() => {
      expect(actions.createCourse).toHaveBeenCalledWith('user-1', 'Physics', 'CS102');
    });
  });

  it('does not create course if prompt is cancelled', async () => {
    (window.prompt as jest.Mock).mockReturnValue(null);
    render(<Sidebar userId="user-1" />);
    await waitFor(() => screen.getByText('CS101'));

    fireEvent.click(screen.getByText('New Chat'));
    fireEvent.click(screen.getByText('+ Add Course'));

    await waitFor(() => {
      expect(actions.createCourse).not.toHaveBeenCalled();
    });
  });

  // --- RENAMING FLOWS ---
  it('handles editing a conversation title (Academic)', async () => {
    render(<Sidebar userId="user-1" />);
    await waitFor(() => screen.getByText('Math Chat'));

    const editBtn = screen.getAllByRole('button').find(b => b.innerHTML.includes('lucide-pen') || b.innerHTML.includes('lucide-edit'));
    fireEvent.click(editBtn!);

    const input = screen.getByDisplayValue('Math Chat');
    fireEvent.change(input, { target: { value: 'New Math Chat' } });
    
    const checkBtn = screen.getAllByRole('button').find(b => b.innerHTML.includes('lucide-check'));
    fireEvent.click(checkBtn!);

    await waitFor(() => {
      expect(actions.renameConversation).toHaveBeenCalledWith('convo-1', 'New Math Chat');
      // Wait for the input to disappear so we know the state update finished!
      expect(screen.queryByDisplayValue('New Math Chat')).not.toBeInTheDocument();
    });
  });

  it('ignores empty string when renaming', async () => {
    render(<Sidebar userId="user-1" />);
    await waitFor(() => screen.getByText('Math Chat'));

    const editBtn = screen.getAllByRole('button').find(b => b.innerHTML.includes('lucide-pen') || b.innerHTML.includes('lucide-edit'));
    fireEvent.click(editBtn!);

    const input = screen.getByDisplayValue('Math Chat');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(actions.renameConversation).not.toHaveBeenCalled();
    });
  });

  // --- DELETION FLOWS ---
  it('cancels chat deletion when confirm is false', async () => {
    (window.confirm as jest.Mock).mockReturnValue(false);
    render(<Sidebar userId="user-1" />);
    await waitFor(() => screen.getByText('Math Chat'));

    const trashBtn = screen.getAllByRole('button').find(b => b.innerHTML.includes('lucide-trash'));
    fireEvent.click(trashBtn!); 

    await waitFor(() => {
      expect(actions.deleteConversation).not.toHaveBeenCalled();
    });
  });

  it('deletes chat and redirects if user is currently on that chat page', async () => {
    mockPathname = '/dashboard/chat/convo-1'; 
    (window.confirm as jest.Mock).mockReturnValue(true);
    
    render(<Sidebar userId="user-1" />);
    await waitFor(() => screen.getByText('Math Chat'));

    const trashBtn = screen.getAllByRole('button').find(b => b.innerHTML.includes('lucide-trash'));
    fireEvent.click(trashBtn!); 

    await waitFor(() => {
      expect(actions.deleteConversation).toHaveBeenCalledWith('convo-1'); 
      expect(mockPush).toHaveBeenCalledWith('/dashboard'); 
    });
  });

  it('deletes course successfully when confirmed', async () => {
    (window.confirm as jest.Mock).mockReturnValue(true);
    render(<Sidebar userId="user-1" />);
    await waitFor(() => screen.getByText('Math Chat'));

    fireEvent.click(screen.getByText('New Chat')); 
    
    const courseTrashBtn = screen.getAllByRole('button').filter(b => b.innerHTML.includes('lucide-trash'))[0];
    fireEvent.click(courseTrashBtn);

    await waitFor(() => {
      expect(actions.deleteCourse).toHaveBeenCalledWith('course-1'); 
    });
  });

  it('does not delete course when confirm is false', async () => {
    (window.confirm as jest.Mock).mockReturnValue(false);
    render(<Sidebar userId="user-1" />);
    await waitFor(() => screen.getByText('Math Chat'));

    fireEvent.click(screen.getByText('New Chat')); 
    const courseTrashBtn = screen.getAllByRole('button').filter(b => b.innerHTML.includes('lucide-trash'))[0];
    fireEvent.click(courseTrashBtn);

    await waitFor(() => {
      expect(actions.deleteCourse).not.toHaveBeenCalled(); 
    });
  });

  // --- PRIVATE TAB FLOWS ---
  it('handles edit and delete inside the private tab', async () => {
    (window.confirm as jest.Mock).mockReturnValue(true);
    render(<Sidebar userId="user-1" />);
    await waitFor(() => screen.getByText('Math Chat'));

    fireEvent.click(screen.getByRole('button', { name: /Private/i }));
    await waitFor(() => screen.getByText('Secret Chat'));

    // 1. Test Edit
    const editBtn = screen.getAllByRole('button').find(b => b.innerHTML.includes('lucide-pen') || b.innerHTML.includes('lucide-edit'));
    fireEvent.click(editBtn!);
    
    const input = screen.getByDisplayValue('Secret Chat');
    fireEvent.change(input, { target: { value: 'New Secret Chat' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Ensure we wait for the editing state to finish before moving on to click delete!
    await waitFor(() => {
      expect(actions.renameConversation).toHaveBeenCalledWith('convo-2', 'New Secret Chat');
      expect(screen.queryByDisplayValue('New Secret Chat')).not.toBeInTheDocument(); // Verifies UI has updated
    });

    // 2. Test Delete (Now safe because the DOM has re-rendered)
    const deleteBtn = screen.getAllByRole('button').find(b => b.innerHTML.includes('lucide-trash'));
    fireEvent.click(deleteBtn!);

    await waitFor(() => {
      expect(actions.deleteConversation).toHaveBeenCalledWith('convo-2');
    });
  });
});