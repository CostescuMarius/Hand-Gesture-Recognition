import React from 'react';
import ReactDOM from 'react-dom/client';

import Profile from './profile/Profile.jsx';
import UserProvider from './context/UserProvider.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <UserProvider>
      <Profile />
    </UserProvider>
  </React.StrictMode>
);