import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import {
  ClerkProvider,
  SignedOut,
  SignedIn,
  SignUpButton,
  SignInButton,
  UserButton,
} from '@clerk/nextjs';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PDF AI Chat',
  description: 'Upload PDFs and chat with them using AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {/* ── Signed Out: Full-screen auth page ── */}
          <SignedOut>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 relative overflow-hidden">
              {/* Ambient glow orbs */}
              <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

              {/* Auth card */}
              <div className="relative z-10 w-full max-w-sm mx-4 p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl text-center">

                {/* PDF icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 mb-5">
                  <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">PDF AI Chat</h1>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  Upload your PDF documents and have intelligent conversations powered by AI.
                </p>

                <div className="flex flex-col gap-3">
                  <SignInButton mode="modal" forceRedirectUrl="/">
                    <button className="w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] cursor-pointer">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal" forceRedirectUrl="/">
                    <button className="w-full py-3 px-6 rounded-xl border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer">
                      Create Account
                    </button>
                  </SignUpButton>
                </div>

                <p className="text-slate-600 text-xs mt-6">Powered by OpenAI &amp; Qdrant</p>
              </div>
            </div>
          </SignedOut>

          {/* ── Signed In: Navbar + page content ── */}
          <SignedIn>
            <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-sm tracking-tight">PDF AI Chat</span>
              </div>
              <UserButton />
            </header>
            {children}
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}
