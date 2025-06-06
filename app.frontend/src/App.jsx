import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Auth from './Pages/Auth';
import NotFound from './Pages/NotFound'; 
import Dashboard from './Pages/Dashboard';
import Teams from './Pages/Teams';
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
