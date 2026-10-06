import { useState, type ReactNode } from "react"
import logo from "./assets/logo.png"

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
        <img className="pin-mark" src={logo} alt="" />
        <p className="eyebrow">Week at a Glance</p>
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
