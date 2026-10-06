import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import PinLock from "./PinLock"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PinLock>
      <App />
    </PinLock>
  </React.StrictMode>,
)
