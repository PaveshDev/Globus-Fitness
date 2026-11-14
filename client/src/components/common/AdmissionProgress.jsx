export default function AdmissionProgress({ admission }) {
  const current = admission.status === 'APPROVED' ? 2 : admission.status === 'AWAITING_ADMIN' ? 1 : 0
  return <ol className="admission-steps" aria-label="Membership registration steps">
    {['Pay admission', 'Admin WhatsApp confirmation', 'Choose a membership plan'].map((label, index) => <li key={label} className={index < current ? 'is-complete' : index === current ? 'is-current' : ''} aria-current={index === current ? 'step' : undefined}>
      <span className="step-number" aria-hidden="true">{index < current ? '✓' : index + 1}</span><span>{label}{index < current && <small>Completed</small>}</span>
    </li>)}
  </ol>
}
