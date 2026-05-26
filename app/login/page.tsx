// app/login/page.tsx
'use client'

import React, { useState, useTransition } from "react"
import { loginWithCredentials } from "@/lib/actions/auth-guest"
import { Mail, ArrowRight, BookOpen, AlertCircle, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!identifier.trim()) {
      setError("Silakan masukkan email atau username Anda.")
      return
    }

    if (!password.trim()) {
      setError("Silakan masukkan password Anda.")
      return
    }

    startTransition(async () => {
      try {
        await loginWithCredentials(identifier, password)
      } catch (err: any) {
        setError(err.message || "Gagal masuk ke akun.")
      }
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-white text-gray-900 font-sans max-w-md mx-auto" id="login-container">
      {/* Header Brand */}
      <div className="flex flex-col items-center mb-10 text-center">
        <div className="w-14 h-14 bg-[#FF6321] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100 mb-4">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter" id="login-title">
          Masuk ke Bookstride
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
          LATIH PIKIRANMU • PANTAU PROGRESMU
        </p>
      </div>

      <div className="w-full space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email / Username Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">
              EMAIL / USERNAME
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Masukkan email atau username Anda"
                required
                disabled={isPending}
                className="w-full px-4 py-3.5 bg-gray-50 border border-transparent rounded-xl font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#FF6321] focus:bg-white transition-all text-sm"
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">
              PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda"
                required
                disabled={isPending}
                className="w-full px-4 py-3.5 pr-12 bg-gray-50 border border-transparent rounded-xl font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#FF6321] focus:bg-white transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || !identifier.trim() || !password.trim()}
            className="w-full py-4 bg-[#FF6321] text-white rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2.5 active:scale-95 transition-transform shadow-lg shadow-orange-100 disabled:opacity-50"
          >
            {isPending ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Register Redirect link */}
        <div className="text-center pt-4">
          <p className="text-xs text-gray-500 font-semibold">
            Belum punya akun?{" "}
            <Link href="/register" className="text-[#FF6321] font-extrabold hover:underline">
              Daftar disini
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-16 text-center">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          Dengan melanjutkan, Anda menyetujui ketentuan Bookstride.
        </p>
      </div>
    </div>
  )
}
