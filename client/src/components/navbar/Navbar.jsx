import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { gymImages } from '../../data/gym.js'
import ContactLink from '../common/ContactLink.jsx'
import Icon from '../common/Icon.jsx'
import { useAuth } from '../../context/AuthContext.js'

export default function Navbar() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
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

  const handleBrandClick = (event) => {
    closeMenu()
    if (location.pathname === '/') {
      event.preventDefault()
      if (window.location.hash) {
        window.history.pushState(null, '', '/')
      }
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
      window.scrollTo({ top: 0, behavior })
      document.getElementById('main-content')?.focus({ preventScroll: true })
    } else {
      navigate('/')
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }

  return (
    <header className="site-header" ref={headerRef}>
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label="Globus Fitness home" onClick={handleBrandClick}>
          <img src={gymImages.logo} alt="Globus Fitness Club Logo" width="60" height="60" />
          <span>GLOBUS<span className="brand-subtitle">FITNESS CLUB</span></span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="/#gym">Home </a>
          <a href="/#equipment">Equipment</a>
          <a href="/#membership">Membership</a>
          <a href="/#jersey">Jersey</a>
          <ContactLink className="nav-contact" />
        </nav>
        <div className="desktop-actions">
          {user ? (
            <>
              <Link to="/member" className="login-link member-user-link" title={`Account: ${user.name || 'Member'}`}>
                <Icon name="user" className="user-icon" />
                <span className="user-name">{user.name || user.username || 'My account'}</span>
              </Link>
              <Link to="/member" className="button button-primary button-small">My account<Icon name="arrow" /></Link>
            </>
          ) : (
            <>
              <Link to="/login" className="login-link">Member Login</Link>
              <Link to="/register" className="button button-primary button-small">Join Now<Icon name="arrow" /></Link>
            </>
          )}
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
          {user ? (
            <>
              <Link to="/member" className="button button-outline member-user-mobile-btn" onClick={closeMenu}>
                <Icon name="user" className="user-icon" />
                <span className="user-name">{user.name || user.username || 'My account'}</span>
              </Link>
              <Link to="/member" className="button button-primary" onClick={closeMenu}>My account<Icon name="arrow" /></Link>
            </>
          ) : (
            <>
              <Link to="/login" className="button button-outline" onClick={closeMenu}>Member Login</Link>
              <Link to="/register" className="button button-primary" onClick={closeMenu}>Join Now<Icon name="arrow" /></Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

