import styles from './Nav.module.css';
export function Nav() {
  return <nav className={styles.nav} data-reveal="nav" aria-label="Main navigation">
    <a href="#" aria-label="easylog home"><img className={styles.logo} src="https://assets.uberdesigner.ai/easylog/logo.svg" alt="easylog" /></a>
    <div className={styles.links}>{['Main','Platform','Use','Cases','Integrations','Journal','Contact'].map(label => <a href="#" key={label}>{label}</a>)}</div>
    <button className={styles.menu} type="button">menu</button>
  </nav>;
}
