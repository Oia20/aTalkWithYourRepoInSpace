import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import GitHubRepoVisualizer from './ThreeD-File-System.tsx'
import Controls from './Legend.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GitHubRepoVisualizer owner="Formbee" repo="Formbee" />
    <Controls />
  </StrictMode>,
)
