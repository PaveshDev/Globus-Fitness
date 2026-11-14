import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAuth } from '../../context/AuthContext.js'
import useApi from '../../hooks/useApi.js'
import { api } from '../../services/api.js'
import { formatPrice } from '../../data/gym.js'
import PaymentTable from '../../components/common/PaymentTable.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import AdmissionProgress from '../../components/common/AdmissionProgress.jsx'

export default function PaymentHistory() {
  const { user } = useAuth()
  const [search] = useSearchParams()
  const options = useApi('/payments/options')
  const [page, setPage] = useState(1)
  const history = useApi(`/payments?page=${page}`)
  const [form, setForm] = useState({ planId: 'admission', billingName: user.name, billingEmail: '', billingAddress: '', billingCity: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const key = useRef(null)
  const order = search.get('order')
  const returnedPayment = history.data?.payments.find((payment) => payment.id === order)
  const returnedStatus = returnedPayment?.status
  const reloadHistory = history.reload
  const reloadOptions = options.reload
  const admissionState = options.data?.admission.status
  function refreshPayments() { reloadHistory(); reloadOptions() }
  useEffect(() => {
    if (!order || (returnedStatus && returnedStatus !== 'PENDING')) return
    let checks = 0
    const timer = setInterval(() => { reloadHistory(); reloadOptions(); if (++checks >= 12) clearInterval(timer) }, 5000)
    return () => clearInterval(timer)
  }, [order, returnedStatus, reloadHistory, reloadOptions])
  useEffect(() => {
    const onFocus = () => reloadOptions()
    window.addEventListener('focus', onFocus)
    const timer = admissionState === 'AWAITING_ADMIN' ? setInterval(() => { if (!document.hidden) reloadOptions() }, 15_000) : null
    return () => { window.removeEventListener('focus', onFocus); if (timer) clearInterval(timer) }
  }, [admissionState, reloadOptions])

  function update(event) {
    key.current = null
    setForm({ ...form, [event.target.name]: event.target.value })
    setError('')
  }
  async function checkout(event) {
    event.preventDefault()
    if (busy || !options.data?.gateway.ready || !plan || admissionState === 'AWAITING_ADMIN') return
    setBusy(true)
    setError('')
    if (key.current?.planId !== plan.id) key.current = { planId: plan.id, value: crypto.randomUUID() }
    try {
      const result = await api('/payments/checkout', { method: 'POST', body: { ...form, planId: plan.id, idempotencyKey: key.current.value } })
      if (!['https://sandbox.payhere.lk/pay/checkout', 'https://www.payhere.lk/pay/checkout'].includes(result.action)) throw new Error('Checkout is unavailable. Please try again.')
      const redirect = document.createElement('form')
      redirect.method = 'POST'
      redirect.action = result.action
      for (const [name, value] of Object.entries(result.fields)) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = name
        input.value = value
        redirect.appendChild(input)
      }
      document.body.appendChild(redirect)
      redirect.submit()
      redirect.remove()
      reloadHistory()
    } catch (error) { setError(error.message); setBusy(false); if (error.status === 403 || error.status === 409) reloadOptions() }
  }
  const plan = options.data?.plans.find((plan) => plan.id === form.planId) || options.data?.plans[0]
  return <section className="account-content" aria-labelledby="payments-title">
    <h1 id="payments-title">Payments</h1>
    <p className="account-intro">Start with your admission fee. After payment is received, the admin will confirm your admission on WhatsApp and unlock membership payments.</p>
    {options.data?.admission && !options.error && <AdmissionProgress admission={options.data.admission} />}
    {order && <div className="account-notice" role="status">{returnedPayment?.status === 'PAID' ? 'Payment confirmed. Your receipt details are saved below.' : returnedPayment && returnedPayment.status !== 'PENDING' ? 'Checkout finished. See the confirmed payment status below.' : search.get('checkout') === 'cancelled' ? 'Checkout was closed. Payment confirmation may still be pending; check your history before trying again.' : 'Waiting for payment confirmation. This page checks for updates automatically for one minute. You can also refresh your history.'}</div>}
    <div className="payment-layout">
      <section className="payment-panel" aria-labelledby="make-payment-title">
        <h2 id="make-payment-title">{admissionState === 'AWAITING_ADMIN' ? 'Admission paid' : admissionState === 'APPROVED' ? 'Membership payment' : 'Pay your admission'}</h2>
        {options.loading ? <p role="status">Loading payment options…</p> : options.error ? <div><p className="form-status error" role="alert">{options.error}</p><button className="button button-outline" onClick={options.reload}>Retry payment options</button></div> : <>
          {admissionState === 'AWAITING_ADMIN' ? <div className="admission-waiting"><p className="account-notice" role="status">Your admission payment was received. Please wait for the admin’s WhatsApp confirmation. Monthly and yearly plans will unlock after the admin confirms you have been notified.</p><p className="payment-note">You do not need to pay admission again.</p><button className="button button-outline" onClick={refreshPayments}>Check admission status</button></div> : <>
          {admissionState === 'PAYMENT_REQUIRED' && <p className="payment-note admission-policy">Admission is required before you can choose a monthly or yearly membership.</p>}
          {admissionState === 'APPROVED' && <p className="account-notice" role="status">Your admission is confirmed. Choose your membership plan below.</p>}
          {!options.data.gateway.ready ? <p id="checkout-availability" className="account-notice" role="status">You can enter your billing details below. PayHere checkout will be available soon; details are saved only when checkout starts.</p> : options.data.gateway.sandbox && <p className="account-notice">Test checkout is enabled. No real payment will be taken.</p>}
          <form className="auth-form payment-form" onSubmit={checkout}>
            <fieldset disabled={busy}>
              <legend className="sr-only">Payment and billing details</legend>
              <div className="field-group"><label htmlFor="planId">Payment for</label><select id="planId" name="planId" value={plan?.id || ''} onChange={update} required>{options.data.plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title} — {formatPrice(plan.amountMinor / 100)}</option>)}</select></div>
              <div className="field-group"><label htmlFor="billingName">Billing name</label><input id="billingName" name="billingName" autoComplete="name" required maxLength={120} value={form.billingName} onChange={update} /></div>
              <div className="field-group"><label htmlFor="billingEmail">Email for payment</label><input id="billingEmail" name="billingEmail" type="email" autoComplete="email" required maxLength={254} value={form.billingEmail} onChange={update} /></div>
              <div className="field-group"><label htmlFor="billingAddress">Billing address</label><input id="billingAddress" name="billingAddress" autoComplete="street-address" required maxLength={250} value={form.billingAddress} onChange={update} /></div>
              <div className="field-group"><label htmlFor="billingCity">City</label><input id="billingCity" name="billingCity" autoComplete="address-level2" required maxLength={100} value={form.billingCity} onChange={update} /></div>
              <p className="payment-total"><span>Total (LKR)</span><strong>{plan ? formatPrice(plan.amountMinor / 100) : '—'}</strong></p>
              <button className="button button-primary auth-submit" disabled={!plan || !options.data.gateway.ready} aria-describedby={!options.data.gateway.ready ? 'checkout-availability' : undefined}>{busy ? 'Opening PayHere…' : 'Continue to PayHere'}</button>
            </fieldset>
            {error && <p className="form-status error" role="alert">{error}</p>}
            <p className="payment-note">Enter card details only on PayHere’s secure checkout. Admission and membership fees are separate payments.</p>
          </form>
          </>}
        </>}
      </section>
      <section className="payment-history" aria-labelledby="history-title">
        <div className="section-toolbar"><h2 id="history-title">Payment history</h2><button className="button button-outline button-small" disabled={history.loading || options.loading} onClick={refreshPayments}>Refresh</button></div>
        {history.loading ? <p role="status">Loading payment history…</p> : history.error ? <p className="form-status error" role="alert">{history.error}</p> : <><PaymentTable payments={history.data.payments} /><Pagination page={page} totalPages={history.data.totalPages} onChange={setPage} /></>}
      </section>
    </div>
  </section>
}

