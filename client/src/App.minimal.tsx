import React from 'react';

// Minimal test component to verify React is working
function MinimalApp() {
  console.log('MinimalApp rendering...');
  
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f3f4f6'
    }}>
      <h1 style={{ color: '#1f2937', marginBottom: '20px' }}>React App Working</h1>
      <p style={{ color: '#6b7280' }}>Application is rendering successfully</p>
      <div style={{ marginTop: '20px', color: '#374151' }}>
        Current time: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

export default MinimalApp;