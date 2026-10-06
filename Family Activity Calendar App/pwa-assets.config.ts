import {
  defineConfig,
  minimal2023Preset,
} from "@vite-pwa/assets-generator/config"

const background = "#245e46"

// Generates the app icons (favicon, 64/192/512 px, maskable and Apple touch icons) from public/icon.svg.
export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0.1,
      resizeOptions: { background },
    },
    apple: {
      ...minimal2023Preset.apple,
      padding: 0.1,
      resizeOptions: { background },
    },
  },
  images: ["public/icon.svg"],
})
