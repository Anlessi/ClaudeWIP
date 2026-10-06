import { useState, type ReactNode } from "react"

const PIN_LENGTH = 6
const ACCESS_PIN = import.meta.env.VITE_ACCESS_PIN?.trim() ?? ""

export default function PinLock({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")

  if (unlocked) return <>{children}</>

  const isConfigured = /^\d{6}$/.test(ACCESS_PIN)

  const submit = (value: string) => {
    if (value === ACCESS_PIN) {
      setUnlocked(true)
      return
    }
    setPin("")
    setError("Incorrect PIN. Try again.")
  }

  return (
    <main className="pin-screen">
      <form
        className="pin-card"
        onSubmit={(event) => {
          event.preventDefault()
          if (pin.length === PIN_LENGTH) submit(pin)
        }}
      >
        <span className="brand-mark pin-mark" aria-hidden="true">
          <svg
            width={21}
            height={21}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
          </svg>
        </span>
        <p className="eyebrow">Family Flow</p>
        <h1>Enter PIN</h1>

        {isConfigured ? (
          <>
            <label className="pin-label" htmlFor="access-pin">
              Enter the {PIN_LENGTH}-digit PIN to open the calendar.
            </label>
            <input
              id="access-pin"
              className="pin-input"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              maxLength={PIN_LENGTH}
              value={pin}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "pin-error" : undefined}
              onChange={(event) => {
                const digits = event.target.value
                  .replace(/\D/g, "")
                  .slice(0, PIN_LENGTH)
                setPin(digits)
                setError("")
                if (digits.length === PIN_LENGTH) submit(digits)
              }}
            />
            <p className="pin-error" id="pin-error" role="alert">
              {error}
            </p>
            <button
              type="submit"
              className="save-event-button pin-submit"
              disabled={pin.length !== PIN_LENGTH}
            >
              Unlock
            </button>
          </>
        ) : (
          <p className="pin-error" role="alert">
            No access PIN is set up. Add a 6-digit VITE_ACCESS_PIN to .env.local
            and restart the app.
          </p>
        )}
      </form>
    </main>
  )
}
