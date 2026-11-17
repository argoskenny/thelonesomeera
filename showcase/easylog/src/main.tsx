import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Hero } from './components/Hero';
import { Cursor } from './components/Cursor';
import './styles/tokens.css';
import './styles/global.css';
createRoot(document.getElementById('root')!).render(<StrictMode><Hero /><Cursor /></StrictMode>);
