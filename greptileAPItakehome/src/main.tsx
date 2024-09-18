import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import GitHubRepoVisualizer from './3Drepo.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GitHubRepoVisualizer owner="Formbee" repo="Formbee" />
  </StrictMode>,
)
