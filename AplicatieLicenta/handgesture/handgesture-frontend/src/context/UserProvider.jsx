import React, { useState, useEffect } from "react";
import UserContext from "./UserContext.jsx";

/**
 * Component to provide user-specific data to its children.
 */
const UserProvider = ({ children }) => {
  // State variable for holding user data
  const [currentUserData, setCurrentUserData] = useState(null);
  
  // State variable indicating when the request is in progress.
  const [isDataLoadingActive, setIsDataLoadingActive] = useState(true);

  /**
   * Get the current user's data.
   */
  const getUserCurrentData = () => {
    setIsDataLoadingActive(true);

    fetch('api/users/me', {
      method: 'GET'
    }).then((response) => {
      return response.json();
    }).then((data) => {
      setIsDataLoadingActive(false);

      if (data.errorMessage) {
        throw new Error(data.errorMessage);
      }

      setCurrentUserData(data);
    }).catch(error => {
      setIsDataLoadingActive(false);

      setSnackbarMessage(error.message);

      setShowSnackbar(true);
    });
  }

  /**
  * Fetch user data on component mount
  */
  useEffect(() => {
    getUserCurrentData();
  }, []);

  /**
   * Updates the current user data state with the response from server.
   */
  const updateCurrentUser = (updatedUser) => {
    setCurrentUserData({
      ...updatedUser,
    });
  }

  return (
    <UserContext.Provider value={{ currentUserData, updateCurrentUser, isDataLoadingActive }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
