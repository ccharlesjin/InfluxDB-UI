import { Box } from '@mui/material';
import React from 'react';
import Navbar from './dashboard/Navbar'; // Ensure Navbar is imported

const Layout = ({ children }) => {
  return (
    <Box>
      {/* Navbar that should appear on all pages */}
      <Navbar /> 

      {/* Main content area, renders content from the current route */}
      <Box p={2}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
