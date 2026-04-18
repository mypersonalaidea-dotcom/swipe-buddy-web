import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('[main.tsx] About to mount React app');
try {
  const root = document.getElementById("root");
  console.log('[main.tsx] Root element:', root);
  createRoot(root!).render(<App />);
  console.log('[main.tsx] React app mounted successfully');
} catch (err) {
  console.error('[main.tsx] Failed to mount:', err);
  document.body.innerHTML = `<pre style="color:red;padding:20px;">Mount Error: ${err}</pre>`;
}
