import React from 'react';
import Sidebar from '../components/sidebar';
import FeedbackModal from '../components/FeedbackModal';

// In a real implementation, you would extract this from NextAuth or your Session mechanism.
const MOCK_USER_ID = '69afef20717fb2d22f30c2de'; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-white w-full overflow-hidden">
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar userId={MOCK_USER_ID} />
      </div>

      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Floating Feedback Button positioned top-right */}
        <div className="absolute top-3 right-4 z-40">
          <FeedbackModal userId={MOCK_USER_ID} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}