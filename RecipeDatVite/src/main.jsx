import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/Routes.jsx'
import "./index.css";
import './styles/theme.css';    
import { applyTheme, getInitialTheme } from './theme';

applyTheme(getInitialTheme()); 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>
)
