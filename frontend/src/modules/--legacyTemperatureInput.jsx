import { useState } from 'preact/hooks';

export function TemperatureInput() {
  const [targetTemp, setTargetTemp] = useState({
    heater: 0,
    bed: 0,
  });

  const handleSetTemp = (type) => {
    console.log(`Setting ${type} temp to ${targetTemp[type]}°C`);
  };

  return (
    <div className="module">
      <h3 className="module-title">Управление температурой</h3>
      
      <div className="temp-control">
        <div className="temp-group">
          <label>Экструдер:</label>
          <div className="temp-input-row">
            <input
              type="number"
              value={targetTemp.heater}
              onChange={(e) => setTargetTemp(prev => ({
                ...prev,
                heater: Number(e.currentTarget.value)
              }))}
              min="0"
              max="300"
            />
            <button onClick={() => handleSetTemp('heater')}>Применить</button>
          </div>
        </div>

        <div className="temp-group">
          <label>Стол:</label>
          <div className="temp-input-row">
            <input
              type="number"
              value={targetTemp.bed}
              onChange={(e) => setTargetTemp(prev => ({
                ...prev,
                bed: Number(e.currentTarget.value)
              }))}
              min="0"
              max="120"
            />
            <button onClick={() => handleSetTemp('bed')}>Применить</button>
          </div>
        </div>
      </div>
    </div>
  );
}