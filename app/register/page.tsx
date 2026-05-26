// app/register/page.tsx
'use client'

import React, { useState, useTransition } from "react"
import { registerUser } from "@/lib/actions/auth-guest"
import { useRouter } from "next/navigation"
import { 
  Mail, ArrowRight, BookOpen, AlertCircle, 
  User, MapPin, ArrowLeft, Eye, EyeOff
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const locationPresets = [
  "Jakarta, Indonesia",
  "Tangerang, Banten",
  "Bandung, Jawa Barat",
  "Surabaya, Jawa Timur"
]

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [location, setLocation] = useState("Banten, Indonesia")
  const [bio, setBio] = useState("")
  const [error, setError] = useState<string | null>(null)
  
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanUsername = username.trim().toLowerCase()
    if (!cleanUsername) {
      setError("Username wajib diisi.")
      return
    }
    if (/\s/.test(cleanUsername)) {
      setError("Username tidak boleh mengandung spasi.")
      return
    }
    if (!email || !email.includes("@")) {
      setError("Silakan masukkan alamat email yang valid.")
      return
    }
    if (!password) {
      setError("Password wajib diisi.")
      return
    }
    if (password.length < 6) {
      setError("Password minimal terdiri dari 6 karakter.")
      return
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok dengan password.")
      return
    }

    startTransition(async () => {
      try {
        const res = await registerUser({
          username: cleanUsername,
          email: email.trim(),
          passwordInput: password,
          confirmPasswordInput: confirmPassword,
          location: location.trim(),
          bio: bio.trim() || undefined,
          image: "" // String kosong dulu, bisa diisi di Edit Profil
        })

        if (res.success) {
          router.push("/")
          router.refresh()
        } else {
          setError(res.error || "Gagal mendaftarkan akun.")
        }
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan tak terduga selama pendaftaran.")
      }
    })
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 bg-white text-gray-900 font-sans max-w-md mx-auto" id="register-container">
      {/* Tombol Kembali ke Login */}
      <div className="mb-4">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-1.5 text-xs font-black text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 text-[#FF6321]" />
          <span>Kembali ke Login</span>
        </Link>
      </div>

      {/* Header Brand */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-12 h-12 bg-[#FF6321] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100 mb-4">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tighter" id="register-title">
          Daftar Bookstride
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
          BUAT AKUN PEMBACA TERDAFTAR • GRATIS
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
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">
              USERNAME
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="misal: alireza"
                disabled={isPending}
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#FF6321] focus:bg-white transition-all text-sm"
              />
              <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Email Address Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">
              ALAMAT EMAIL
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reza@example.com"
                disabled={isPending}
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#FF6321] focus:bg-white transition-all text-sm"
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">
              PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                disabled={isPending}
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-transparent rounded-xl font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#FF6321] focus:bg-white transition-all text-sm"
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

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">
              KONFIRMASI PASSWORD
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password Anda"
                disabled={isPending}
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-transparent rounded-xl font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#FF6321] focus:bg-white transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Location Picker */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">
              LOKASI
            </label>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="misal: Tangerang, Banten"
                disabled={isPending}
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#FF6321] focus:bg-white transition-all text-sm"
              />
              <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            
            {/* Quick Location Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {locationPresets.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocation(loc)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all active:scale-95",
                    location === loc 
                      ? "bg-orange-50 border-orange-200 text-[#FF6321]" 
                      : "bg-gray-50 border-gray-150 text-gray-500 hover:bg-gray-100"
                  )}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Bio Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">
              BIOGRAFI / SLOGAN (OPSIONAL)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="misal: Pecinta buku fiksi"
              rows={2}
              maxLength={200}
              className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#FF6321] focus:bg-white transition-all text-sm resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 bg-[#FF6321] hover:bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2.5 active:scale-95 transition-transform shadow-lg shadow-orange-100 disabled:opacity-50 text-sm mt-3"
          >
            {isPending ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Daftar Akun</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Back navigation footer */}
        <div className="text-center pt-2 border-t border-gray-50">
          <p className="text-sm text-gray-500 font-semibold">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-[#FF6321] font-extrabold hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
