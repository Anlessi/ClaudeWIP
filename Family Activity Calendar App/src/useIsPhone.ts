import { useEffect, useState } from "react"

/** Must match the phone `@media (max-width: 600px)` block in index.css. */
const PHONE_QUERY = "(max-width: 600px)"

/**
 * Whether the screen is phone-sized, where the hour rows and event cards are smaller. It changes when the
 * window crosses the phone width (for example when a tablet is turned).
 */
export default function useIsPhone() {
  const [isPhone, setIsPhone] = useState(() => window.matchMedia(PHONE_QUERY).matches)

  useEffect(() => {
    const query = window.matchMedia(PHONE_QUERY)
    const follow = () => setIsPhone(query.matches)
    query.addEventListener("change", follow)
    return () => query.removeEventListener("change", follow)
  }, [])

  return isPhone
}
