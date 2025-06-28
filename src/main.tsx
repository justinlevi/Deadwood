import React from 'react';
import ReactDOM from 'react-dom/client';
import DeadwoodGame from './DeadwoodGame';

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <DeadwoodGame />
  </React.StrictMode>
);
