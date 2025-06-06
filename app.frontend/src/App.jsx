import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Auth from './Pages/Auth';
import NotFound from './Pages/NotFound'; 
import Dashboard from './Pages/Dashboard';
import Teams from './Pages/Teams';
import Project from './Pages/Projects'
import ProjectView from './Pages/ProjectView';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/projects/" element={<Project />} />
        <Route path="*" element={<NotFound />} />
<Route path='/projects/:projectId' element={<ProjectView />} />
      </Routes>
    </Router>
  );
};

export default App;
