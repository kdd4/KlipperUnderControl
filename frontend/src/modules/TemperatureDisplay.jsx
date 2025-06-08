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

  /**
   * Функция линейной интерполяции между двумя числами.
   */
  const lerp = (a, b, t) => a + (b - a) * t;

  /**
   * Интерполирует между двумя цветами, заданными объектами вида {r, g, b},
   * используя коэффициент t (от 0 до 1). Результат возвращается в виде строки "rgb(r, g, b)".
   */
  const interpolateColor = (color1, color2, t) => {
    const r = Math.round(lerp(color1.r, color2.r, t));
    const g = Math.round(lerp(color1.g, color2.g, t));
    const b = Math.round(lerp(color1.b, color2.b, t));
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Задаем цветовые точки. При желании можно заменить на вычисленные значения из CSS-переменных.
  const startColor = { r: 239, g: 245, b: 66 };   // Например, var(--logo-color)
  const midColor   = { r: 255, g: 0, b: 0  };     // orange
  const endColor   = { r: 182, g: 0,   b: 196 };     // rgb(182, 0, 196)

  // Устанавливаем пороговые значения для диапазонов разницы.
  const minDiff = -10;  // Ниже этой разницы – фиксированный начальный цвет.
  const midDiff = 0;  // Промежуточная точка: именно здесь получаем orange.
  const maxDiff = 10; // Выше или равная этой разнице – фиксированный конечный цвет.

  /**
  * Функция возвращает цвет с плавным градиентом в зависимости от разницы current - target.
  */
  const getTemperatureColor = (current, target) => {
    const diff = current - target;

    if (diff <= minDiff) {
      // Если разница меньше или равна минимальному порогу – фиксированный начальный цвет.
      return `rgb(${startColor.r}, ${startColor.g}, ${startColor.b})`;
    } else if (diff >= maxDiff) {
      // Если разница больше или равна максимальному порогу – фиксированный конечный цвет.
      return `rgb(${endColor.r}, ${endColor.g}, ${endColor.b})`;
    } else if (diff <= midDiff) {
      // Разница между minDiff и midDiff – интерполируем от startColor к midColor.
      const t = (diff - minDiff) / (midDiff - minDiff);
      return interpolateColor(startColor, midColor, t);
    } else {
      // Разница между midDiff и maxDiff – интерполируем от midColor к endColor.
      const t = (diff - midDiff) / (maxDiff - midDiff);
      return interpolateColor(midColor, endColor, t);
    }
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