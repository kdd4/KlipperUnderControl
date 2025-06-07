import { useState, useEffect } from 'preact/hooks';
import { API } from '../config';

export function TemperatureDisplay() {
  const [temperatures, setTemperatures] = useState({
    extruder: { current: 0, target: 0 },
    bed: { current: 0, target: 0 }
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemperatures = async () => {
      try {
        const response = await fetch(API + '/api/temperature.php');
        if (!response.ok) {
          throw new Error('Failed to fetch temperatures');
        }
        const data = await response.json();
        
        if (data.success) {
          setTemperatures({
            extruder: {
              current: data.data.extruder.temperature || 0,
              target: data.data.extruder.target || 0
            },
            bed: {
              current: data.data.heater_bed.temperature || 0,
              target: data.data.heater_bed.target || 0
            }
          });
          setError(null);
        } else {
          setError(data.error || 'Unknown error');
        }
      } catch (err) {
        setError(err.message);
        console.error('Temperature fetch error:', err);
      }
    };

    // Первый запрос сразу
    fetchTemperatures();
    
    // Обновление каждые 2 секунды
    const interval = setInterval(fetchTemperatures, 2000);

    return () => clearInterval(interval);
  }, []);

  const getTemperatureColor = (current, target) => {
    const diff = (current - target);
    if (diff < 2) return 'var(--logo-color)';
    if (diff < 10) return 'orange';
    if (diff > 10) return 'rgb(182 0 196)';
    return 'var(--text-light)';
  };

  if (error) {
    return (
      <div className="temperature-display error">
        <span>Ошибка загрузки температур: {error}</span>
      </div>
    );
  }

  return (
    <div className="temperature-display">
      <div className="temp-item">
        <div className="temp-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
          </svg>
        </div>
        <div className="temp-info">
          <span className="temp-label">Экструдер</span>
          <div className="temp-values">
            <span 
              className="temp-current" 
              style={{ color: getTemperatureColor(temperatures.extruder.current, temperatures.extruder.target) }}
            >
              {temperatures.extruder.current.toFixed(1)}°C
            </span>
            <span className="temp-separator">/</span>
            <span className="temp-target">{temperatures.extruder.target}°C</span>
          </div>
        </div>
      </div>

      <div className="temp-item">
        <div className="temp-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 4h16v2H4zm0 4h16v12H4z"/>
          </svg>
        </div>
        <div className="temp-info">
          <span className="temp-label">Стол</span>
          <div className="temp-values">
            <span 
              className="temp-current"
              style={{ color: getTemperatureColor(temperatures.bed.current, temperatures.bed.target) }}
            >
              {temperatures.bed.current.toFixed(1)}°C
            </span>
            <span className="temp-separator">/</span>
            <span className="temp-target">{temperatures.bed.target}°C</span>
          </div>
        </div>
      </div>
    </div>
  );
}