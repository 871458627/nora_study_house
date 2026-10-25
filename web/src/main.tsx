import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './app/App';
import { AppProvider } from './app/AppProvider';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');

ReactDOM.createRoot(root).render(
  <HashRouter>
    <AppProvider>
      <App />
    </AppProvider>
  </HashRouter>,
);
