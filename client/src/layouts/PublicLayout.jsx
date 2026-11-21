import { useEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import Navbar from '../components/navbar/Navbar.jsx'
import { gymImages } from '../data/gym.js'

export default function PublicLayout() {
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)

  useEffect(() => {
    const titles = { '/': 'Globus Fitness | Show up. Get stronger.', '/login': 'Login | Globus Fitness', '/register': 'Register | Globus Fitness' }
    document.title = titles[pathname] || (pathname.startsWith('/member') || pathname === '/admin' ? 'My account | Globus Fitness' : 'Page not found | Globus Fitness')
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: 'instant' })
    if (previousPath.current !== pathname) {
      document.getElementById('main-content')?.focus({ preventScroll: true })
      previousPath.current = pathname
    }
  }, [pathname])

  const handleFooterBrandClick = (event) => {
    if (pathname === '/') {
      event.preventDefault()
      if (window.location.hash) {
        window.history.pushState(null, '', '/')
      }
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
      window.scrollTo({ top: 0, behavior })
      document.getElementById('main-content')?.focus({ preventScroll: true })
    }
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar key={pathname} />
      <main id="main-content" tabIndex="-1"><Outlet /></main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <Link to="/" className="brand" aria-label="Globus Fitness home" onClick={handleFooterBrandClick}><img src={gymImages.logo} alt="Globus Fitness Club Logo" width="50" height="50" /><span>GLOBUS<span className="brand-subtitle">FITNESS CLUB</span></span></Link>
          <p>Show up. Put in the work. Keep going.</p>
          <span>© {new Date().getFullYear()} Globus Fitness</span>
        </div>
      </footer>
    </>
  )
}

