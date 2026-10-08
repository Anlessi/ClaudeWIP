import React from "react"
import ReactDOM from "react-dom/client"
import { inject } from "@vercel/analytics"
import { injectSpeedInsights } from "@vercel/speed-insights"
import App from "./App"
import PinLock from "./PinLock"
import "./index.css"

// Vercel Web Analytics: counts visits without cookies or personal data. It reports only on the
// Vercel site; in the dev server it just logs to the console.
inject()

// Vercel Speed Insights: measures how fast pages load for real visitors (Core Web Vitals), also
// without cookies. Like analytics, it only reports from the Vercel site.
injectSpeedInsights()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PinLock>
      <App />
    </PinLock>
  </React.StrictMode>,
)
