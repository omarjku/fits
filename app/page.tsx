'use client'
import dynamic from 'next/dynamic'

// The app reads localStorage while rendering, so it runs in the browser only.
const App = dynamic(() => import('../src/App'), { ssr: false })

export default function Page() {
  return <App />
}
