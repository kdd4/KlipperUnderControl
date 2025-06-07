import { useState } from 'preact/hooks';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FileMonitor } from './modules/FileMonitor';
import { AxisControl } from './modules/AxisControl';
import { MacroEditor } from './modules/MacroEditor';
import { TemperatureModule } from './modules/TemperatureModule';
import { SettingsInterface } from './modules/SettingsInterface';
import Router from 'preact-router';

const AuthScreen = ({ onAuthenticate }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // В реальном проекте здесь должно быть шифрование и проверка на сервере
    if (password === 'admin') {
      onAuthenticate(true);
    } else {
      setError('Неверный пароль');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Авторизация</h2>
        </div>
        <img className="auth-logo" src="../src/assets/logo/BasicLogo.png"/>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="password">Пароль:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          
          {error && <div className="auth-error">{error}</div>}
          
          <button type="submit" className="auth-button">
            Войти
          </button>
        </form>
      </div>
    </div>
  );
};


export function App() {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return <AuthScreen onAuthenticate={setAuthenticated} />;
  }

  return (
    <div className="app">
      <Header />
      <main className="content">
        <Router>
          <Dashboard path="/" />
          <Printing path="/printing" />
          <Files path="/files" />
          <MacroEditor path="/editor" />
          <Settings path="/settings" />
        </Router>
      </main>
      <Footer />
    </div>
  );
}

// Создаём компоненты для страниц
const Dashboard = () => (
  <div className="dashboard">
    <div className="column" style="min-width:60%;">
      <FileMonitor />
    </div>
    <div className="column" style="min-width:25%;">
      <TemperatureModule />
    </div>
    <MacroEditor />
  </div>
);

const Printing = () => (
  <div className="dashboard">
    <div className="column">
      <TemperatureModule />
    </div>
    <div className="column">
      <AxisControl />
    </div>
  </div>
);

const Files = () => (
  <div>
    <h2>Страница файлов</h2>
    <FileMonitor />
  </div>
);

const Settings = () => (
  <div>
    <h2>Настройки</h2>
    {/* Здесь будет контент настроек */}
    <SettingsInterface />
  </div>
);
