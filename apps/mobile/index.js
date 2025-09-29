import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppRegistry } from 'react-native';
import App from './App';

console.log('Index.js is executing...');

// Register the app with React Native
AppRegistry.registerComponent('main', () => App);

// For web only - direct React DOM mounting with proper React context
if (typeof document !== 'undefined') {
  console.log('Document found, creating React app...');
  const container = document.getElementById('root');
  if (container) {
    console.log('Root element found, mounting app...');

    // Create a wrapper component to ensure proper React context
    const WebApp = () => {
      return React.createElement(App);
    };

    const root = createRoot(container);
    root.render(React.createElement(WebApp));
    console.log('App mounted successfully!');
  } else {
    console.error('Root element not found!');
  }
} else {
  console.log('No document - running in mobile environment');
}