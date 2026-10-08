import React from "react"
import ReactDOM from "react-dom/client"
import { inject } from "@vercel/analytics"
import App from "./App"
import PinLock from "./PinLock"
import "./index.css"

// Vercel Web Analytics: counts visits without cookies or personal data. It reports only on the
// Vercel site; in the dev server it just logs to the console.
inject()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PinLock>
      <App />
    </PinLock>
  </React.StrictMode>,
)
