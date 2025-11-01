import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/Routes.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { RecipeProvider } from './contexts/RecipeContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import "./index.css";
import './styles/theme.css';    
import { applyTheme, getInitialTheme } from './theme';

applyTheme(getInitialTheme()); 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <RecipeProvider>
            <AppRoutes />
          </RecipeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
