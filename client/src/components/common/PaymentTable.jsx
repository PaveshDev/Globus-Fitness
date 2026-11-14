import { formatPrice } from '../../data/gym.js'

export default function PaymentTable({ payments, admin = false }) {
  if (!payments.length) return <p className="empty-state">No payments yet. Your payment records will appear here after you start a checkout.</p>
  return <div className="table-scroll" role="region" aria-label="Payment records" tabIndex={0}>
    <table className="records-table">
      <caption className="sr-only">Payment records, newest first</caption>
      <thead><tr><th scope="col">Payment</th>{admin && <th scope="col">Member</th>}<th scope="col">Date</th><th scope="col">Amount</th><th scope="col">Status</th></tr></thead>
      <tbody>{payments.map((payment) => <tr key={payment.id}>
        <td><strong>{payment.description}</strong>{payment.sandbox && <span className="test-label">Test payment</span>}<small>Order: {payment.id}</small>{payment.providerPaymentId && <small>PayHere: {payment.providerPaymentId}</small>}</td>
        {admin && <td>{payment.user.name}<small>+{payment.user.phone}</small></td>}
        <td>{new Date(payment.createdAt).toLocaleDateString('en-LK', { timeZone: 'Asia/Colombo', dateStyle: 'medium' })}</td>
        <td className="amount-cell">{formatPrice(payment.amountMinor / 100)}</td>
        <td><span className={`payment-status status-${payment.status.toLowerCase()}`}>{({ PENDING: 'Awaiting confirmation', PAID: 'Paid', FAILED: 'Failed', CANCELLED: 'Cancelled', CHARGEDBACK: 'Charged back' })[payment.status]}</span></td>
      </tr>)}</tbody>
    </table>
  </div>
}
