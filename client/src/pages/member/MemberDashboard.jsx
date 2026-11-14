import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext.js'

export default function MemberDashboard() {
  const { user } = useAuth()
  return (
    <section className="account-content" aria-labelledby="profile-title">
      <h1 id="profile-title">My profile</h1>
      <p className="account-intro">Your registration details are saved. First, pay your admission fee. Once the admin confirms your payment on WhatsApp, you can choose a membership plan.</p>
      <dl className="profile-details">
        <div><dt>Full name</dt><dd>{user.name}</dd></div><div><dt>Phone number</dt><dd>+{user.phone}</dd></div>
        <div><dt>NIC number</dt><dd>{user.nic}</dd></div><div><dt>Registered on</dt><dd>{new Date(user.createdAt).toLocaleDateString('en-LK', { timeZone: 'Asia/Colombo', dateStyle: 'medium' })}</dd></div>
      </dl>
      <Link className="button button-primary" to="/member/payments">View payments</Link>
    </section>
  )
}

