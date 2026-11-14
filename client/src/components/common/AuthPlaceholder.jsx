import { Link } from 'react-router'
import Icon from './Icon.jsx'

export default function AuthPlaceholder({ title, description, status = 'Coming soon' }) {
  return (
    <section className="container account-placeholder">
      <p className="eyebrow">GLOBUS FITNESS MEMBERS</p>
      <h1>{title}</h1>
      <p>{description}</p>
      {status && <span className="coming-soon">{status}</span>}
      <Link to="/" className="button button-primary">Back to the gym<Icon name="arrow" /></Link>
    </section>
  )
}

