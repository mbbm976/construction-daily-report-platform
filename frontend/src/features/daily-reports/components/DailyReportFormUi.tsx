import type { ReactNode } from 'react'

type DraftFeedbackTone = 'success' | 'info'
type ValidationFeedbackTone = 'warning' | 'error'

type FormFieldProps = {
  id?: string
  label: string
  children: ReactNode
  fullWidth?: boolean
  error?: string
  required?: boolean
}

export function FormField({
  id,
  label,
  children,
  fullWidth = false,
  error,
  required = false,
}: FormFieldProps) {
  return (
    <div className={fullWidth ? 'md:col-span-2' : undefined}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required ? ' *' : ''}
      </label>
      {children}
      {id && error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}

type DraftFeedbackBannerProps = {
  tone: DraftFeedbackTone
  message: string
}

export function DraftFeedbackBanner({ tone, message }: DraftFeedbackBannerProps) {
  return (
    <div
      className={`mt-6 rounded-xl border p-4 text-sm ${
        tone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-blue-200 bg-blue-50 text-blue-800'
      }`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  )
}

type ValidationFeedbackBannerProps = {
  tone: ValidationFeedbackTone
  title: string
  description: string
  messages: string[]
}

export function ValidationFeedbackBanner({
  tone,
  title,
  description,
  messages,
}: ValidationFeedbackBannerProps) {
  return (
    <div
      className={`mt-6 rounded-xl border p-4 text-sm ${
        tone === 'error'
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-amber-200 bg-amber-50 text-amber-800'
      }`}
      role="alert"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{description}</p>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        {messages.map((message, index) => (
          <li key={`${message}-${index}`}>{message}</li>
        ))}
      </ul>
    </div>
  )
}
