import { useState, useEffect } from 'preact/hooks';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FileMonitor } from './modules/FileMonitor';
import { AxisControl } from './modules/AxisControl';
import { MacroEditor } from './modules/MacroEditor';
import { TemperatureModule } from './modules/TemperatureModule';
import { SettingsInterface } from './modules/SettingsInterface';
import Router from 'preact-router';
import { apiPost } from './api';

const AuthScreen = ({ onAuthenticate }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Используем правильные пути к API
      const endpoint = isRegister ? '/api/register.php' : '/api/login.php';
      const response = await apiPost(endpoint, { 
        login: login.trim(), 
        password: password.trim() 
      });
      
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('expires_at', response.expires_at);
      
      onAuthenticate(true);
    } catch (err) {
      console.error('Auth error:', err);
      
      // Уточнённые сообщения об ошибках
      let errorMessage = 'Ошибка сервера';
      if (err.message.includes('401')) errorMessage = 'Неверные учётные данные';
      if (err.message.includes('409')) errorMessage = 'Пользователь уже существует';
      if (err.message.includes('400')) errorMessage = 'Некорректные данные';
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{isRegister ? 'Регистрация' : 'Авторизация'}</h2>
        </div>
        <img className="auth-logo" src="../src/assets/logo/BasicLogo.png" alt="Logo"/>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="login">Логин:</label>
            <input
              type="text"
              id="login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              minLength={3}
              autoComplete="username"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Пароль:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
            />
          </div>
          
          {error && <div className="auth-error">{error}</div>}
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Обработка...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
          </button>
          
          <div className="auth-toggle" style="text-align: center; margin-top: 1em" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </div>
        </form>
      </div>
    </div>
  );
};

export function App() {
  const [authenticated, setAuthenticated] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      const expiresAt = localStorage.getItem('expires_at');
      
      if (accessToken && expiresAt && parseInt(expiresAt) > Math.floor(Date.now() / 1000)) {
        setAuthenticated(true);
      }
    };
    
    checkAuth();
  }, []);

  if (!authenticated) {
    return <AuthScreen onAuthenticate={setAuthenticated} />;
  }

  return (
    <div className="app">
      <Header onLogout={() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('expires_at');
        setAuthenticated(false);
      }} />
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
    <SettingsInterface />
  </div>
);