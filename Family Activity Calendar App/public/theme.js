// Set the theme before the first paint so there is no flash. This is a separate file, not inline in
// index.html, because the Content-Security-Policy in vercel.json does not allow inline scripts.
try {
  var t = localStorage.getItem("familyflow.theme")
  if (t !== "light" && t !== "dark")
    t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  document.documentElement.dataset.theme = t
} catch (e) {}
