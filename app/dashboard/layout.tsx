import React from 'react';
import Sidebar from '../components/sidebar';

// In a real implementation, you would extract this from NextAuth or your Session mechanism.
const MOCK_USER_ID = '69a1a812cdefc20b0418be58'; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-white w-full overflow-hidden">
      {/* Pane 1 & 2 combined logically: Navigation Sidebar 
        Contains the Course groupings and Chronological Chat lists.
        Hidden on very small mobile screens (could be toggled via a hamburger menu in production).
      */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar userId={MOCK_USER_ID} />
      </div>

      {/* Pane 3: Active Chat Window (Main Content Area)
        Provides the wrapper for the discussion view to render chronologically nested messages.
      */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}