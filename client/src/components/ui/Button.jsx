import './Button.css';

function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  const variantClass = `ui-button--${variant}`;
  const sizeClass = `ui-button--${size}`;
  const classes = ['ui-button', variantClass, sizeClass, className].filter(Boolean).join(' ');

  return <button className={classes} {...props} />;
}

export default Button;
