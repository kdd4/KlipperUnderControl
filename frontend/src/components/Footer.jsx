export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <button 
        className="scroll-top"
        onClick={scrollToTop}
        title="Наверх"
      >
        ↑
      </button>

      <div className="system-info">
        <span id="version">Версия: 1.0.0</span>
        <span className="href"><a href="https://discord.ru">Контакты: discord.ru</a></span>
      </div>
    </footer>
  );
}