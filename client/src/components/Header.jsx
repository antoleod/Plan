import './Header.css';

function Header({ user, onLogout }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <h2>Planning Timesheet</h2>
        <div className="header-user">
          <span className="user-name">{user?.name}</span>
          <span className="user-role">{user?.role === 'MANAGER' ? 'Manager' : 'Agent'}</span>
          <button onClick={onLogout} className="btn-logout">
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
