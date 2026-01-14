import './Badge.css';

function Badge({ variant = 'neutral', className = '', children, ...props }) {
  const classes = ['ui-badge', `ui-badge--${variant}`, className].filter(Boolean).join(' ');
  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}

export default Badge;
