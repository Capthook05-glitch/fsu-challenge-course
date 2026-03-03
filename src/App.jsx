import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Assuming you have an AuthContext for auth flow
import Home from './components/Home'; // Home component
import Login from './components/Login'; // Login component
import Dashboard from './components/Dashboard'; // Auth protected Dashboard component
import NotFound from './components/NotFound'; // 404 Not Found component

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Switch>
          <Route path='/' exact component={Home} />
          <Route path='/login' component={Login} />
          <Route path='/dashboard' component={Dashboard} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    </AuthProvider>
  );
};

export default App;