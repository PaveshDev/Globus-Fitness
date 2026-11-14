import { useState } from 'react'
import useApi from '../../hooks/useApi.js'
import PaymentTable from '../../components/common/PaymentTable.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import AdmissionReview from '../../components/common/AdmissionReview.jsx'

export default function AdminDashboard() {
  const [view, setView] = useState('members')
  const [page, setPage] = useState(1)
  const result = useApi(`/admin/${view}?page=${page}`)
  return <section className="account-content">
    <h1>Administration</h1><p className="account-intro">Review members and payments. In Admissions, notify members on WhatsApp after their payment succeeds, then unlock their membership plans.</p>
    <div className="section-toolbar"><div className="record-filters" aria-label="Record type">{['members', 'admissions', 'payments'].map((item) => <button key={item} className="button button-outline button-small" aria-pressed={view === item} onClick={() => { setView(item); setPage(1) }}>{({ members: 'Members', admissions: 'Admissions', payments: 'Payments' })[item]}</button>)}</div><button className="button button-outline button-small" disabled={result.loading} onClick={result.reload}>Refresh</button></div>
    {result.loading ? <p role="status">Loading records…</p> : result.error ? <p className="form-status error" role="alert">{result.error}</p> : <>
      <p className="record-count">{result.data.total} {view}</p>
      {view === 'admissions' ? <AdmissionReview admissions={result.data.admissions} sandbox={result.data.sandbox} onConfirmed={result.reload} /> : view === 'payments' ? <PaymentTable payments={result.data.payments} admin /> : !result.data.members.length ? <p className="empty-state">No registered members yet.</p> : <div className="table-scroll" role="region" aria-label="Registered members" tabIndex={0}><table className="records-table"><caption className="sr-only">Registered members</caption><thead><tr><th scope="col">Name</th><th scope="col">Phone</th><th scope="col">NIC</th><th scope="col">Role</th><th scope="col">Registered</th></tr></thead><tbody>{result.data.members.map((member) => <tr key={member.id}><td>{member.name}</td><td>+{member.phone}</td><td>{member.nic}</td><td>{member.role === 'ADMIN' ? 'Admin' : 'Member'}</td><td>{new Date(member.createdAt).toLocaleDateString('en-LK', { timeZone: 'Asia/Colombo' })}</td></tr>)}</tbody></table></div>}
      <Pagination page={page} totalPages={result.data.totalPages} onChange={setPage} />
    </>}
  </section>
}

