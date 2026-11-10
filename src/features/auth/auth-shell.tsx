import type { ReactNode } from 'react'
// Cropped from the design mockup; replace with the SVG export from Figma when available.
import logo from '@/assets/testify-logo.png'

/** Logo and card shared by the signed-out screens. */
export function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description: ReactNode
  children: ReactNode
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#0b0f14] px-4 py-12 font-dm-sans text-white">
      <img src={logo} alt="Testify" width={172} height={56} className="mb-10" />
      <section
        aria-labelledby="auth-title"
        className="w-full max-w-[456px] rounded-[20px] border border-[#181f2c] bg-[#0f1623] p-6 sm:p-10"
      >
        <h1 id="auth-title" className="text-[32px] leading-tight font-bold tracking-[-0.5px]">
          {title}
        </h1>
        <p className="mt-3 text-[15px] text-[#a3a8b2]">{description}</p>
        {children}
      </section>
      <p className="mt-7 text-[13px] text-[#8b909a]">Authorized administrators only.</p>
    </main>
  )
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-2 pl-4 text-[13px] text-[#f97066]">
      {message}
    </p>
  )
}
