import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

function restoreGitHubPagesRoute() {
    const shellUrl = new URL(window.location.href);
    const route = shellUrl.searchParams.get('spa');

    if (!route) return;

    shellUrl.searchParams.delete('spa');
    const fallback = `${shellUrl.pathname}${shellUrl.search}${shellUrl.hash}`;

    try {
        if (!route.startsWith('/') || route.startsWith('//')) {
            throw new Error('Only local application paths may be restored.');
        }

        const target = new URL(route, shellUrl.origin);
        if (target.origin !== shellUrl.origin) {
            throw new Error('Cross-origin application paths are not allowed.');
        }

        window.history.replaceState(window.history.state, '', `${target.pathname}${target.search}${target.hash}`);
    } catch {
        window.history.replaceState(window.history.state, '', fallback);
    }
}

restoreGitHubPagesRoute();

ReactDOM.createRoot(document.getElementById('app')).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
