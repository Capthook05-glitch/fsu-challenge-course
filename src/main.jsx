import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
import ReactDOM from 'react-dom';
import './styles.css';

ReactDOM.render(
  <React.StrictMode>
    <h1>Hello, world!</h1>
  </React.StrictMode>,
  document.getElementById('root')
);
