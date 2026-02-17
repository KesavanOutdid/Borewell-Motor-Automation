import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminRoutes from './routes/AdminRoutes';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<AdminRoutes />} />
      </Routes>
    </Router>
  );
};

export default App;
