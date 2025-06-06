import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Auth from './Pages/Auth';
import NotFound from './Pages/NotFound'; 
import Teams from './Pages/Teams';
import Project from './Pages/Projects';
import ProjectView from './Pages/ProjectView';

import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Auth />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Teams />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/projects" element={<Project />} />
          <Route path="/projects/:projectId" element={<ProjectView />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
