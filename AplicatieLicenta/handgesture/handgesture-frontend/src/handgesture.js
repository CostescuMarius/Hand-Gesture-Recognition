import React from 'react';
import ReactDOM from 'react-dom/client';

import HandGestureApp from './handgesture/AppContainer.jsx';
import UserProvider from './context/UserProvider.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <UserProvider>
      <HandGestureApp />
    </UserProvider>
  </React.StrictMode>
);