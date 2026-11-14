import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import Icon from '../../components/common/Icon.jsx'
import { api } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.js'

const initialForm = {
  name: '',
  phone: '',
  nic: '',
  password: '',
  confirmPassword: '',
}

function normalizePhone(value) {
  return value.replace(/\D/g, '')
}

function validateName(value) {
  return value.trim().length >= 2 && value.trim().length <= 120 ? '' : 'Enter your full name (2–120 characters).'
}

function validatePhone(value) {
  const digits = normalizePhone(value)
  const isSriLankanNumber = /^[+\d\s()-]{9,25}$/.test(value) && /^(?:0|94)?[1-9]\d{8}$/.test(digits)
  return isSriLankanNumber ? '' : 'Enter a valid WhatsApp number (for example: 0771234567 or +94771234567).'
}

function validateNic(value) {
  const nic = value.trim()
  const isOldFormat = /^\d{9}[VvXx]$/.test(nic)
  const isNewFormat = /^\d{12}$/.test(nic)
  return isOldFormat || isNewFormat ? '' : 'NIC must be either 9 digits followed by V/X or 12 digits.'
}

function validatePassword(value) {
  if (value.length < 8) return 'Password must be at least 8 characters long.'
  if (value.length > 128) return 'Password must be no more than 128 characters.'
  if (!/[a-z]/.test(value)) return 'Password must include at least one lowercase letter.'
  if (!/[A-Z]/.test(value)) return 'Password must include at least one uppercase letter.'
  if (!/\d/.test(value)) return 'Password must include at least one number.'
  return ''
}

export default function Register() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    const nextForm = { ...form, [name]: value }
    setForm(nextForm)

    const fieldErrors = { ...errors }
    if (name === 'name') fieldErrors.name = validateName(value)
    if (name === 'phone') fieldErrors.phone = validatePhone(value)
    if (name === 'nic') fieldErrors.nic = validateNic(value)
    if (name === 'password') {
      fieldErrors.password = validatePassword(value)
      if (nextForm.confirmPassword && value !== nextForm.confirmPassword) {
        fieldErrors.confirmPassword = 'Passwords do not match.'
      } else if (nextForm.confirmPassword) {
        fieldErrors.confirmPassword = ''
      }
    }
    if (name === 'confirmPassword') {
      fieldErrors.confirmPassword = value && value !== nextForm.password ? 'Passwords do not match.' : ''
    }

    setErrors(fieldErrors)
    setSubmitMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

    const nextErrors = {
      name: validateName(form.name),
      phone: validatePhone(form.phone),
      nic: validateNic(form.nic),
      password: validatePassword(form.password),
      confirmPassword: form.confirmPassword && form.confirmPassword === form.password ? '' : 'Please confirm your password correctly.',
    }

    setErrors(nextErrors)

    const isValid = Object.values(nextErrors).every((message) => !message)

    if (!isValid) {
      setSubmitMessage('Please fix the highlighted fields and try again.')
      document.getElementById(Object.keys(nextErrors).find((field) => nextErrors[field]))?.focus()
      return
    }

    setSubmitting(true)
    setSubmitMessage('')
    try {
      const details = { name: form.name, phone: form.phone, nic: form.nic, password: form.password }
      const result = await api('/auth/register', { method: 'POST', body: details })
      setUser(result.user)
      navigate('/member', { replace: true })
    } catch (error) {
      setSubmitMessage(error.message)
      if (error.fields) setErrors(error.fields)
    } finally { setSubmitting(false) }
  }

  if (user) return <Navigate to="/member" replace />
  return (
    <section className="container auth-page">
      <div className="auth-shell">
        <div className="auth-copy">
          <p className="eyebrow">MEMBER REGISTRATION</p>
          <h1>Join Globus Fitness</h1>
          <p>Complete your profile, add your WhatsApp number, and create a secure password to get started.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" type="text" autoComplete="name" maxLength={120} required disabled={submitting} value={form.name} onChange={updateField} placeholder="Enter your full name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} />
            {errors.name && <small id="name-error">{errors.name}</small>}
          </div>

          <div className="field-group">
            <label htmlFor="phone">Phone number (WhatsApp)</label>
            <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={25} required disabled={submitting} value={form.phone} onChange={updateField} placeholder="0771234567 or +94771234567" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'phone-error' : undefined} />
            {errors.phone && <small id="phone-error">{errors.phone}</small>}
          </div>

          <div className="field-group">
            <label htmlFor="nic">NIC number</label>
            <input id="nic" name="nic" type="text" maxLength={12} required disabled={submitting} value={form.nic} onChange={updateField} placeholder="200123456789 or 123456789V" aria-invalid={Boolean(errors.nic)} aria-describedby={errors.nic ? 'nic-error' : undefined} />
            {errors.nic && <small id="nic-error">{errors.nic}</small>}
          </div>

          <div className="field-row">
            <div className="field-group">
              <label htmlFor="password">Create password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" maxLength={128} required disabled={submitting} value={form.password} onChange={updateField} placeholder="Create a password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} />
              {errors.password && <small id="password-error">{errors.password}</small>}
            </div>

            <div className="field-group">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" maxLength={128} required disabled={submitting} value={form.confirmPassword} onChange={updateField} placeholder="Re-enter password" aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined} />
              {errors.confirmPassword && <small id="confirmPassword-error">{errors.confirmPassword}</small>}
            </div>
          </div>

          <button type="submit" className="button button-primary auth-submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
            <Icon name="arrow" />
          </button>

          {submitMessage && (
            <p className="form-status error" role="alert">
              {submitMessage}
            </p>
          )}

          <p className="auth-footer">
            Already a member? <Link to="/login">Login here</Link>
          </p>
        </form>
      </div>
    </section>
  )
}

