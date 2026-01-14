import './RoleNav.css';

function RoleNav({ role, items = [], activeId, onSelect }) {
  return (
    <aside className="role-nav">
      <div className="role-nav__header">
        <p className="role-nav__role">{role}</p>
        <small className="role-nav__hint">Selecciona una sección</small>
      </div>
      <div className="role-nav__items">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`role-nav__item ${activeId === item.id ? 'is-active' : ''}`}
            onClick={() => onSelect?.(item.id)}
          >
            <span className="role-nav__title">{item.label}</span>
            <span className="role-nav__desc">{item.description}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

export default RoleNav;
