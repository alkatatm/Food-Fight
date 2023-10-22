import React, { createContext, useState, useContext } from 'react';

// Create the context with default values
const UserContext = createContext({
  userId: null,
  setUserId: () => {}
});

// Create a custom hook for easier access to the UserContext
export function useUser() {
  return useContext(UserContext);
}

// Define the provider component
export function UserProvider({ children }) {
  const [userId, setUserId] = useState(null);

  const value = {
    userId,
    setUserId
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export default UserContext;  // This export is unnecessary because you're already exporting `useUser` and `UserProvider`.
