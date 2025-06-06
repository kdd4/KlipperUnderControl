import { TemperatureDisplay } from './TemperatureDisplay';
import { TemperatureControl } from './TemperatureControl';

export function TemperatureModule() {
  return (
    <div className="module temperature-module">
      <h3 className="module-title">Управление температурой</h3>
      <TemperatureDisplay />
      <TemperatureControl />
    </div>
  );
}