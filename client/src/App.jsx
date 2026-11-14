import { BrowserRouter } from 'react-router'
import AppRoutes from './routes/AppRoutes.jsx'
import AuthProvider from './context/AuthProvider.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider><AppRoutes /></AuthProvider>
    </BrowserRouter>
  )
}

