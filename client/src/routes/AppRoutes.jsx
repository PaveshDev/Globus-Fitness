import { Route, Routes } from 'react-router'
import PublicLayout from '../layouts/PublicLayout.jsx'
import Home from '../pages/public/Home.jsx'
import Login from '../pages/auth/Login.jsx'
import Register from '../pages/auth/Register.jsx'
import AuthPlaceholder from '../components/common/AuthPlaceholder.jsx'
import MemberLayout from '../layouts/MemberLayout.jsx'
import MemberDashboard from '../pages/member/MemberDashboard.jsx'
import PaymentHistory from '../pages/member/PaymentHistory.jsx'
import AdminDashboard from '../pages/admin/AdminDashboard.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="member" element={<MemberLayout />}>
          <Route index element={<MemberDashboard />} />
          <Route path="payments" element={<PaymentHistory />} />
        </Route>
        <Route path="admin" element={<MemberLayout admin />}><Route index element={<AdminDashboard />} /></Route>
        <Route path="*" element={<AuthPlaceholder title="Page not found" description="This page isn’t here. Head back to explore Globus Fitness." status={null} />} />
      </Route>
    </Routes>
  )
}

