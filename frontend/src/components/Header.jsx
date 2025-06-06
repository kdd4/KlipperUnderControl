import { route } from 'preact-router';

export function Header() {
  const navigate = (path) => {
    route(path);
  };

  return (
    <header className="header">
      <img 
        src="../src/assets/logo/BasicLogo.png" 
        className="logo" 
        alt="Логотип"
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer' }}
      />
      
      <nav>
        <button className="nav-button" onClick={() => navigate('/')}>
          Главная
        </button>
        <button className="nav-button" onClick={() => navigate('/printing')}>
          Печать
        </button>
        <button className="nav-button" onClick={() => navigate('/files')}>
          Файлы
        </button>
        <button className="nav-button" onClick={() => navigate('/settings')}>
          ⚙️
        </button>
      </nav>
    </header>
  );
}