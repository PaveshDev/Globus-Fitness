import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { gymImages } from '../../data/gym.js'
import ContactLink from '../common/ContactLink.jsx'
import Icon from '../common/Icon.jsx'
import { useAuth } from '../../context/AuthContext.js'

export default function Navbar() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleRef = useRef(null)
  const headerRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }
    function onPointerDown(event) {
      if (!headerRef.current?.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header" ref={headerRef}>
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label="Globus Fitness home" onClick={closeMenu}>
          <img src={gymImages.logo} alt="" width="52" height="52" />
          <span>GLOBUS<span className="brand-subtitle">FITNESS CLUB</span></span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="/#gym">The gym</a>
          <a href="/#equipment">Equipment</a>
          <a href="/#membership">Membership</a>
          <a href="/#jersey">Jersey</a>
          <ContactLink className="nav-contact" />
        </nav>
        <div className="desktop-actions">
          {user ? <Link to="/member" className="button button-primary button-small">My account<Icon name="arrow" /></Link> : <>
          <Link to="/login" className="login-link">Login</Link>
          <Link to="/register" className="button button-primary button-small">Register<Icon name="arrow" /></Link>
          </>}
        </div>
        <button ref={toggleRef} className="menu-toggle" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>
          <Icon name={menuOpen ? 'close' : 'menu'} />
        </button>
      </div>
      <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation" hidden={!menuOpen}>
        <a href="/#gym" onClick={closeMenu}>The gym</a>
        <a href="/#equipment" onClick={closeMenu}>Equipment</a>
        <a href="/#membership" onClick={closeMenu}>Membership</a>
        <a href="/#jersey" onClick={closeMenu}>Jersey</a>
        <ContactLink className="nav-contact" onClick={closeMenu} />
        <div className="mobile-auth">
          {user ? <Link to="/member" className="button button-primary" onClick={closeMenu}>My account</Link> : <>
          <Link to="/login" className="button button-outline" onClick={closeMenu}>Login</Link>
          <Link to="/register" className="button button-primary" onClick={closeMenu}>Register<Icon name="arrow" /></Link>
          </>}
        </div>
      </nav>
    </header>
  )
}

