export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Login link expired</h1>
        <p className="text-muted-foreground mb-4">Magic links expire after 1 hour. Request a new one.</p>
        <a href="/vendor-login" className="text-primary underline">Back to login</a>
      </div>
    </div>
  )
}
