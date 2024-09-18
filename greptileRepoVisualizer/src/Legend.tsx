import { useState } from 'react';
import './Legend.css';
const Controls = () => {
    const [isOpen, setIsOpen] = useState(true);
  
    const togglePanel = () => {
      setIsOpen(!isOpen);
    };
  
    return (
      <div className={`controls-container ${isOpen ? 'open' : 'closed'}`}>
        <div className="controls-panel">
          <div className="toggle-bar" onClick={togglePanel}>
            <span className="toggle-text">Legend & Controls</span>
            <span className={`arrow-indicator ${isOpen ? 'up' : 'down'}`}>&#9660;</span>
          </div>
  
          <div className="controls-content">
            <h3 className="controls-header">Controls</h3>
            <ul className="controls-list">
              <li><span className="control-action">Left Click:</span> Open orb (file)</li>
              <li><span className="control-action">Right Click Orb:</span> Greptile the file</li>
              <li><span className="control-action">Shift + Left/Right Click Drag:</span> Pan camera</li>
            </ul>
            <h4 className="legend-header">Legend</h4>
            <ul className="color-legend">
              <li><span className="color-box blue"></span>Blue = Unopened folder</li>
              <li><span className="color-box green"></span>Green = File</li>
              <li><span className="color-box yellow"></span>Yellow = Opened folder</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };
  
  export default Controls;