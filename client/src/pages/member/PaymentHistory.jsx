import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAuth } from '../../context/AuthContext.js'
import useApi from '../../hooks/useApi.js'
import { api } from '../../services/api.js'
import { formatPrice } from '../../data/gym.js'
import PaymentTable from '../../components/common/PaymentTable.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import AdmissionProgress from '../../components/common/AdmissionProgress.jsx'
import Icon from '../../components/common/Icon.jsx'
import { createWhatsAppUrl } from '../../utils/whatsapp.js'

const SAMPLE_BANK = {
  bankName: 'Commercial Bank of Ceylon',
  accountName: 'Globus Fitness (Pvt) Ltd',
  accountNumber: '8009 1234 5678 9012',
  rawAccountNumber: '8009123456789012',
  branch: 'Colombo Main Branch (Code: 001)',
  accountType: 'Current Account',
  amount: 'Rs. 2,500',
}

export default function PaymentHistory() {
  const { user } = useAuth()
  const [search] = useSearchParams()
  const options = useApi('/payments/options')
  const [page, setPage] = useState(1)
  const history = useApi(`/payments?page=${page}`)
  const [form, setForm] = useState({ planId: 'admission', billingName: user.name, billingEmail: '', billingAddress: '', billingCity: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
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

  function copyAccount() {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(SAMPLE_BANK.rawAccountNumber)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function submitBankTransfer(selectedPlanId = 'admission', planTitle = 'Admission fee') {
    setBusy(true)
    setError('')
    try {
      await api('/payments/bank-transfer', {
        method: 'POST',
        body: { planId: selectedPlanId, reference: `Bank Transfer - ${user.name} (${planTitle})` },
      })
      refreshPayments()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

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
  const admissionWhatsAppMessage = `Hi Globus Fitness, I have transferred the admission fee (Rs. 2,500). Please find my bank payment slip attached.\n\nName: ${user.name}\nPhone: +${user.phone}`
  const admissionWhatsAppUrl = createWhatsAppUrl(import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER, admissionWhatsAppMessage)

  const membershipWhatsAppMessage = `Hi Globus Fitness, I have transferred the membership fee for ${plan?.title || 'Membership'} (${plan ? formatPrice(plan.amountMinor / 100) : ''}). Please find my bank payment slip attached.\n\nName: ${user.name}\nPhone: +${user.phone}`
  const membershipWhatsAppUrl = createWhatsAppUrl(import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER, membershipWhatsAppMessage)

  return <section className="account-content" aria-labelledby="payments-title">
    <h1 id="payments-title">Payments</h1>
    <p className="account-intro">Start with your admission fee. After payment is received, the admin will confirm your admission on WhatsApp and unlock membership payments.</p>
    {options.data?.admission && !options.error && <AdmissionProgress admission={options.data.admission} />}
    {order && <div className="account-notice" role="status">{returnedPayment?.status === 'PAID' ? 'Payment confirmed. Your receipt details are saved below.' : returnedPayment && returnedPayment.status !== 'PENDING' ? 'Checkout finished. See the confirmed payment status below.' : search.get('checkout') === 'cancelled' ? 'Checkout was closed. Payment confirmation may still be pending; check your history before trying again.' : 'Waiting for payment confirmation. This page checks for updates automatically for one minute. You can also refresh your history.'}</div>}
    <div className="payment-layout">
      <section className="payment-panel" aria-labelledby="make-payment-title">
        <h2 id="make-payment-title">{admissionState === 'AWAITING_ADMIN' ? 'Admission paid' : admissionState === 'APPROVED' ? 'Membership payment' : 'Bank transfer details'}</h2>
        {options.loading ? <p role="status">Loading payment options…</p> : options.error ? <div><p className="form-status error" role="alert">{options.error}</p><button className="button button-outline" onClick={options.reload}>Retry payment options</button></div> : <>
          {admissionState === 'AWAITING_ADMIN' ? (
            <div className="admission-waiting">
              <p className="account-notice" role="status">Your admission payment was received. Please wait for the admin’s WhatsApp confirmation. Monthly and yearly plans will unlock after the admin confirms you have been notified.</p>
              <p className="payment-note">You do not need to pay admission again.</p>
              <button className="button button-outline" onClick={refreshPayments}>Check admission status</button>
            </div>
          ) : admissionState === 'APPROVED' ? (
            <div>
              <p className="account-notice" role="status">Your admission is confirmed. Choose your membership plan below.</p>
              {!options.data.gateway.ready ? (
                <div className="bank-details-wrapper">
                  <div className="field-group">
                    <label htmlFor="planId">Select Membership Plan</label>
                    <select id="planId" name="planId" value={plan?.id || ''} onChange={update} required>
                      {options.data.plans.map((p) => (
                        <option key={p.id} value={p.id}>{p.title} — {formatPrice(p.amountMinor / 100)}</option>
                      ))}
                    </select>
                  </div>
                  <p className="payment-total"><span>Total Fee (LKR)</span><strong>{plan ? formatPrice(plan.amountMinor / 100) : '—'}</strong></p>
                  <p className="payment-note">Transfer the membership fee to the gym bank account below, then share your slip with admin on WhatsApp:</p>

                  <div className="bank-card">
                    <div className="bank-card-header">
                      <Icon name="bank" />
                      <span className="bank-title">{SAMPLE_BANK.bankName}</span>
                      <span className="bank-type">{SAMPLE_BANK.accountType}</span>
                    </div>
                    <dl className="bank-data-list">
                      <div className="bank-data-row"><dt>Account Name</dt><dd>{SAMPLE_BANK.accountName}</dd></div>
                      <div className="bank-data-row">
                        <dt>Account Number</dt>
                        <dd>
                          <div className="account-number-pill">
                            <span>{SAMPLE_BANK.accountNumber}</span>
                            <button type="button" className={`copy-pill-button ${copied ? 'copied' : ''}`} onClick={copyAccount}>
                              <Icon name={copied ? 'check' : 'copy'} />
                              <span>{copied ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </dd>
                      </div>
                      <div className="bank-data-row"><dt>Branch</dt><dd>{SAMPLE_BANK.branch}</dd></div>
                      <div className="bank-data-row"><dt>Amount</dt><dd className="bank-amount-highlight">{plan ? formatPrice(plan.amountMinor / 100) : '—'}</dd></div>
                      <div className="bank-data-row"><dt>Reference</dt><dd>{user.name} ({plan?.title})</dd></div>
                    </dl>
                  </div>

                  <div className="bank-actions">
                    {membershipWhatsAppUrl && (
                      <a className="button-whatsapp-bank" href={membershipWhatsAppUrl} target="_blank" rel="noopener noreferrer">
                        <Icon name="chat" />
                        Send Membership Slip on WhatsApp
                      </a>
                    )}
                    <button type="button" className="button button-transfer-done" disabled={busy} onClick={() => submitBankTransfer(plan?.id, plan?.title)}>
                      {busy ? 'Submitting…' : 'I have sent the membership slip'}
                    </button>
                  </div>
                  {error && <p className="form-status error" role="alert">{error}</p>}
                </div>
              ) : (
                <form className="auth-form payment-form" onSubmit={checkout}>
                  <fieldset disabled={busy}>
                    <legend className="sr-only">Payment and billing details</legend>
                    <div className="field-group"><label htmlFor="planId">Payment for</label><select id="planId" name="planId" value={plan?.id || ''} onChange={update} required>{options.data.plans.map((p) => <option key={p.id} value={p.id}>{p.title} — {formatPrice(p.amountMinor / 100)}</option>)}</select></div>
                    <div className="field-group"><label htmlFor="billingName">Billing name</label><input id="billingName" name="billingName" autoComplete="name" required maxLength={120} value={form.billingName} onChange={update} /></div>
                    <div className="field-group"><label htmlFor="billingEmail">Email for payment</label><input id="billingEmail" name="billingEmail" type="email" autoComplete="email" required maxLength={254} value={form.billingEmail} onChange={update} /></div>
                    <div className="field-group"><label htmlFor="billingAddress">Billing address</label><input id="billingAddress" name="billingAddress" autoComplete="street-address" required maxLength={250} value={form.billingAddress} onChange={update} /></div>
                    <div className="field-group"><label htmlFor="billingCity">City</label><input id="billingCity" name="billingCity" autoComplete="address-level2" required maxLength={100} value={form.billingCity} onChange={update} /></div>
                    <p className="payment-total"><span>Total (LKR)</span><strong>{plan ? formatPrice(plan.amountMinor / 100) : '—'}</strong></p>
                    <button className="button button-primary auth-submit" disabled={!plan || !options.data.gateway.ready}>{busy ? 'Opening PayHere…' : 'Continue to PayHere'}</button>
                  </fieldset>
                  {error && <p className="form-status error" role="alert">{error}</p>}
                </form>
              )}
            </div>
          ) : (
            <div className="bank-details-wrapper">
              <p className="payment-note admission-policy">
                Admission is required before you can choose a monthly or yearly membership.
                Please transfer or deposit the one-time admission fee of <strong>Rs. 2,500</strong> directly to our bank account.
              </p>

              <div className="bank-card">
                <div className="bank-card-header">
                  <Icon name="bank" />
                  <span className="bank-title">{SAMPLE_BANK.bankName}</span>
                  <span className="bank-type">{SAMPLE_BANK.accountType}</span>
                </div>
                <dl className="bank-data-list">
                  <div className="bank-data-row">
                    <dt>Account Name</dt>
                    <dd>{SAMPLE_BANK.accountName}</dd>
                  </div>
                  <div className="bank-data-row">
                    <dt>Account Number</dt>
                    <dd>
                      <div className="account-number-pill">
                        <span>{SAMPLE_BANK.accountNumber}</span>
                        <button
                          type="button"
                          className={`copy-pill-button ${copied ? 'copied' : ''}`}
                          onClick={copyAccount}
                          title="Copy account number"
                          aria-label="Copy account number"
                        >
                          <Icon name={copied ? 'check' : 'copy'} />
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </dd>
                  </div>
                  <div className="bank-data-row">
                    <dt>Branch</dt>
                    <dd>{SAMPLE_BANK.branch}</dd>
                  </div>
                  <div className="bank-data-row">
                    <dt>Admission Fee</dt>
                    <dd className="bank-amount-highlight">{SAMPLE_BANK.amount}</dd>
                  </div>
                  <div className="bank-data-row">
                    <dt>Payment Reference</dt>
                    <dd>{user.name} (+{user.phone})</dd>
                  </div>
                </dl>
              </div>

              <div className="bank-instructions">
                <h4>How to complete your admission:</h4>
                <ol>
                  <li>Transfer <strong>Rs. 2,500</strong> using your mobile banking app, online banking, or cash deposit machine (CDM).</li>
                  <li>Use your <strong>name or phone number</strong> as the payment reference/remarks.</li>
                  <li>Send a photo or screenshot of the payment slip/receipt to our admin on WhatsApp.</li>
                  <li>Click <strong>&quot;I have sent the bank slip&quot;</strong> below to notify the admin. Once confirmed, your membership plans will unlock automatically.</li>
                </ol>
              </div>

              <div className="bank-actions">
                {admissionWhatsAppUrl && (
                  <a
                    className="button-whatsapp-bank"
                    href={admissionWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon name="chat" />
                    Send Receipt via WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  className="button button-transfer-done"
                  disabled={busy}
                  onClick={() => submitBankTransfer('admission', 'Admission fee')}
                >
                  {busy ? 'Submitting…' : 'I have sent the bank slip'}
                </button>
              </div>
              {error && <p className="form-status error" role="alert">{error}</p>}
            </div>
          )}
        </>}
      </section>
      <section className="payment-history" aria-labelledby="history-title">
        <div className="section-toolbar"><h2 id="history-title">Payment history</h2><button className="button button-outline button-small" disabled={history.loading || options.loading} onClick={refreshPayments}>Refresh</button></div>
        {history.loading ? <p role="status">Loading payment history…</p> : history.error ? <p className="form-status error" role="alert">{history.error}</p> : <><PaymentTable payments={history.data.payments} /><Pagination page={page} totalPages={history.data.totalPages} onChange={setPage} /></>}
      </section>
    </div>
  </section>
}


