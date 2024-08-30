export default function Link({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
      target="_blank"
      rel="noreferrer"
      href={href}
    >
      {children}
    </a>
  )
}
