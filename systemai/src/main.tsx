import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useBoot } from './hooks/useBoot';
import './index.css';

const Boot = (): JSX.Element => {
  useBoot();
  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Boot />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
