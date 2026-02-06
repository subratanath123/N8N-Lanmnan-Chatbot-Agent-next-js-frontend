'use client';

import dynamic from 'next/dynamic';

// Explicit dynamic import with proper error handling
const AIChatbotsContent = dynamic(
  () => import('@/component/AIChatbotsContent').then((mod) => mod.default || mod),
  {
    ssr: false,
    loading: () => (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        fontSize: '16px',
        color: '#666'
      }}>
        Loading...
      </div>
    ),
  }
);

export default AIChatbotsContent;

