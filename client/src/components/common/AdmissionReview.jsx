import { useState } from 'react'
import { api } from '../../services/api.js'
import { createWhatsAppUrl } from '../../utils/whatsapp.js'
import { formatPrice } from '../../data/gym.js'

function AdmissionRow({ payment, onConfirmed }) {
  const [notified, setNotified] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(null)
  const approval = saved || payment.admissionApproval
  const message = `${payment.sandbox ? '[TEST PAYMENT] ' : ''}Hi ${payment.user.name}, Globus Fitness has received your admission payment of ${formatPrice(payment.amountMinor / 100)}. Your admission is confirmed. You can now sign in and choose a monthly or yearly membership plan. Thank you!`
  const whatsapp = createWhatsAppUrl(payment.user.phone, message)
  async function confirm() {
    if (!notified || busy) return
    setBusy(true)
    setError('')
    try {
      const result = await api(`/admin/admissions/${payment.id}/confirm-notification`, { method: 'POST', body: { notified: true } })
      setSaved(result.approval)
      onConfirmed()
    } catch (error) { setError(error.message) }
    finally { setBusy(false) }
  }
  return <tr>
    <td><strong>{payment.user.name}</strong><small>+{payment.user.phone}</small></td>
    <td>{formatPrice(payment.amountMinor / 100)}{payment.sandbox && <span className="test-label">Test payment</span>}<small>{new Date(payment.paidAt).toLocaleDateString('en-LK', { timeZone: 'Asia/Colombo', dateStyle: 'medium' })}</small></td>
    <td>{approval ? <><span className="payment-status status-paid">Membership unlocked</span><small>WhatsApp confirmed {new Date(approval.notifiedAt).toLocaleDateString('en-LK', { timeZone: 'Asia/Colombo' })}</small>{approval.notifiedBy && <small>By {approval.notifiedBy.name}</small>}</> : <span className="payment-status">Awaiting WhatsApp confirmation</span>}</td>
    <td className="admission-actions">{approval ? <p className="payment-note">The member can choose a membership plan.</p> : <>
      {whatsapp && <a className="button button-outline button-small" href={whatsapp} target="_blank" rel="noopener noreferrer">Open WhatsApp draft</a>}
      <label className="notification-check"><input type="checkbox" checked={notified} disabled={busy} onChange={(event) => setNotified(event.target.checked)} />I sent the admission confirmation on WhatsApp</label>
      <button className="button button-primary button-small" disabled={!notified || busy} onClick={confirm}>{busy ? 'Unlocking…' : 'Confirm notification & unlock'}</button>
      {error && <p className="form-status error" role="alert">{error}</p>}
    </>}</td>
  </tr>
}

export default function AdmissionReview({ admissions, onConfirmed, sandbox }) {
  return <>
    <p className="account-notice">After sending the member’s confirmation in WhatsApp, tick the confirmation box and unlock membership payments. Opening the draft does not send a message or unlock plans.{sandbox && ' These are sandbox payments; confirmations apply only to test checkout.'}</p>
    {!admissions.length ? <p className="empty-state">No successful admission payments to review yet.</p> : <div className="table-scroll" role="region" aria-label="Admission approvals" tabIndex={0}><table className="records-table"><caption className="sr-only">Successful admissions and WhatsApp confirmations</caption><thead><tr><th scope="col">Member</th><th scope="col">Admission paid</th><th scope="col">Status</th><th scope="col">Notify and unlock</th></tr></thead><tbody>{admissions.map((payment) => <AdmissionRow key={payment.id} payment={payment} onConfirmed={onConfirmed} />)}</tbody></table></div>}
  </>
}
