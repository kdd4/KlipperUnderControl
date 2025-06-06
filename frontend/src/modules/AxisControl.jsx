import { useState } from 'preact/hooks';

export function AxisControl() {
  const [step, setStep] = useState(10);
  const [speed, setSpeed] = useState(100);
  const [activeAxis, setActiveAxis] = useState(null);

  const handleMove = (axis, direction) => {
    console.log(`Moving ${axis}${direction}${step} at ${speed}mm/s`);
    setActiveAxis(`${axis}${direction}`);
    setTimeout(() => setActiveAxis(null), 300);
  };

  const increment = (type, value) => {
    if (type === 'step') {
      setStep(Math.min(100, value + 1));
    } else {
      setSpeed(Math.min(300, value + 10));
    }
  };

  const decrement = (type, value) => {
    if (type === 'step') {
      setStep(Math.max(0.1, value - 1));
    } else {
      setSpeed(Math.max(10, value - 10));
    }
  };

  return (
    <div className="module axis-module">
      <h3 className="module-title">Управление осями</h3>
      
      <div className="axis-grid">
        {/* Ось Z */}
        <div className="axis-group z-axis">
          <button 
            className={`axis-button up ${activeAxis === 'Z+' ? 'active' : ''}`}
            onClick={() => handleMove('Z', '+')}
            aria-label="Поднять ось Z"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M12 4L12 20M12 4L18 10M12 4L6 10" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>
          <div className="axis-label">Ось Z</div>
          <button 
            className={`axis-button down ${activeAxis === 'Z-' ? 'active' : ''}`}
            onClick={() => handleMove('Z', '-')}
            aria-label="Опустить ось Z"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M12 20L12 4M12 20L18 14M12 20L6 14" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>
        </div>

        {/* Ось Y */}
        <div className="axis-group y-axis">
          <button 
            className={`axis-button up ${activeAxis === 'Y+' ? 'active' : ''}`}
            onClick={() => handleMove('Y', '+')}
            aria-label="Движение вперед по оси Y"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M4 12L20 12M20 12L14 6M20 12L14 18" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>
          <div className="axis-label">Ось Y</div>
          <button 
            className={`axis-button down ${activeAxis === 'Y-' ? 'active' : ''}`}
            onClick={() => handleMove('Y', '-')}
            aria-label="Движение назад по оси Y"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M4 12L20 12M4 12L10 6M4 12L10 18" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>
        </div>

        {/* Ось X */}
        <div className="axis-group x-axis">
          <button 
            className={`axis-button left ${activeAxis === 'X-' ? 'active' : ''}`}
            onClick={() => handleMove('X', '-')}
            aria-label="Движение влево по оси X"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M20 12L4 12M4 12L10 6M4 12L10 18" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>
          <div className="axis-label">Ось X</div>
          <button 
            className={`axis-button right ${activeAxis === 'X+' ? 'active' : ''}`}
            onClick={() => handleMove('X', '+')}
            aria-label="Движение вправо по оси X"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M4 12L20 12M20 12L14 6M20 12L14 18" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="control-settings">
        <div className="setting-group">
          <label>Шаг перемещения (mm)</label>
          <div className="value-control">
            <button 
              className="decrement" 
              onClick={() => decrement('step', step)}
              disabled={step <= 0.1}
            >
              -
            </button>
            <input
              type="number"
              value={step}
              onChange={(e) => setStep(Math.max(0.1, Number(e.currentTarget.value)))}
              min="0.1"
              step="0.1"
            />
            <button 
              className="increment" 
              onClick={() => increment('step', step)}
              disabled={step >= 100}
            >
              +
            </button>
          </div>
        </div>

        <div className="setting-group">
          <label>Скорость (mm/s)</label>
          <div className="value-control">
            <button 
              className="decrement" 
              onClick={() => decrement('speed', speed)}
              disabled={speed <= 10}
            >
              -
            </button>
            <input
              type="number"
              value={speed}
              onChange={(e) => setSpeed(Math.max(1, Number(e.currentTarget.value)))}
              min="1"
            />
            <button 
              className="increment" 
              onClick={() => increment('speed', speed)}
              disabled={speed >= 300}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}