import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './App';
import './index.css';

// Pre-wired app entry: Redux Provider + App. Routing (BrowserRouter/Routes)
// lives inside App.tsx — do not add it here.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <Provider store={store}>
    <App />
  </Provider>
);
