// HeaderLogic.js
import { useState } from 'react';
import { showLogoutConfirmation, showLogoutSuccess } from '../../utils/alert';

export const useHeaderLogic = (userInfo) => {
  const [isSidebarPinned, setSidebarPinned] = useState(false);

  // Toggle sidebar pinning
  const toggleSidebar = () => {
    const body = document.body;
    if (isSidebarPinned) {
      body.classList.remove('g-sidenav-pinned');
    } else {
      body.classList.add('g-sidenav-pinned');
    }
    setSidebarPinned(!isSidebarPinned);
  };

  // Handle logout
  const handleLogoutWithConfirmation = (handleLogout) => {
    showLogoutConfirmation().then((result) => {
      if (result.isConfirmed) {
        handleLogout();
        showLogoutSuccess();
      }
    });
  };


  return {
    toggleSidebar, handleLogoutWithConfirmation,
  };
};
