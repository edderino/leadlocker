export default function BuildInfo() {
  return (
    <footer className="text-xs text-gray-400 text-center py-2">
      Env: {process.env.NEXT_PUBLIC_APP_ENV} · Build: {process.env.NEXT_PUBLIC_BUILD_ID}
    </footer>
  )
}
