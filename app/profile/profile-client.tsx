// app/profile/profile-client.tsx
'use client'

import React, { useState, useTransition, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  QrCode, Edit, LogOut, ChevronRight, Award, Trophy, Clock, 
  BookOpen, Sparkles, MapPin, X, Save, AlertCircle, Info, BookCheck,
  ChevronLeft, Upload, Image as ImageIcon
} from 'lucide-react'
import { updateProfile } from '@/lib/actions/profile'
import { logoutGuest } from '@/lib/actions/auth-guest'
import { toggleFollow } from '@/lib/actions/follow-actions'
import { cn, formatDurationFlexibly } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface UserType {
  id: string
  name: string | null
  email: string | null
  image: string | null
  bio: string | null
  location: string | null
  isMe: boolean
  isFollowing?: boolean
  followingCount: number
  followerCount: number
}

interface SessionType {
  id: string
  startTime: Date
  endTime: Date | null
  durationMinutes: number | null
  pagesRead: number | null
  pacePerPage: number | null
  location: string | null
  note: string | null
  photoUrl: string | null
  createdAt: Date
  book: {
    title: string
  }
}

interface ProfileClientProps {
  user: UserType
  booksCount: number
  sessions: SessionType[]
  totalSeconds: number
  totalPages: number
  logoutAction: () => Promise<void>
}

export function ProfileClient({ 
  user, 
  booksCount, 
  sessions, 
  totalSeconds, 
  totalPages,
  logoutAction
}: ProfileClientProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isQrOpen, setIsQrOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Follow states for other profile viewing
  const [isFollowingState, setIsFollowingState] = useState(user.isFollowing || false)
  const [isFollowTransitionPending, startFollowTransition] = useTransition()
  const [followerCountState, setFollowerCountState] = useState(user.followerCount || 0)
  
  // Edit Profile Form State
  const [editName, setEditName] = useState(user.name || '')
  const [editImage, setEditImage] = useState(user.image || '')
  const [editLocation, setEditLocation] = useState(user.location || '')
  const [editBio, setEditBio] = useState(user.bio || '')
  const [errorStr, setErrorStr] = useState<string | null>(null)

  // Generate last 7 days with date keys in timezone-safe format
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i)) // Chronological: 6 days ago, up to today
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const dateVal = String(d.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${dateVal}`
    
    // Sum duration for this day
    const daySessions = sessions.filter(s => {
      const sDateObj = new Date(s.createdAt)
      const sy = sDateObj.getFullYear()
      const sm = String(sDateObj.getMonth() + 1).padStart(2, '0')
      const sd = String(sDateObj.getDate()).padStart(2, '0')
      const sDateStr = `${sy}-${sm}-${sd}`
      return sDateStr === dateStr
    })
    
    const totalMins = daySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
    let dayName = d.toLocaleDateString('id-ID', { weekday: 'short' }) // e.g., Sen, Sel, Rab, Kam, Jum, Sab, Min
    // Just in case regional settings fallback to non-ID environment
    if (dayName.includes('Mon')) dayName = 'Sen'
    if (dayName.includes('Tue')) dayName = 'Sel'
    if (dayName.includes('Wed')) dayName = 'Rab'
    if (dayName.includes('Thu')) dayName = 'Kam'
    if (dayName.includes('Fri')) dayName = 'Jum'
    if (dayName.includes('Sat')) dayName = 'Sab'
    if (dayName.includes('Sun')) dayName = 'Min'

    const dateNum = d.getDate()
    
    return {
      dateStr,
      dayName,
      dateNum,
      totalMins
    }
  })

  // Best Efforts calculations
  const maxDuration = sessions.reduce((max, s) => Math.max(max, s.durationMinutes || 0), 0)
  const maxPages = sessions.reduce((max, s) => Math.max(max, s.pagesRead || 0), 0)
  
  // Find fastest pace
  const validPaces = sessions.filter(s => s.pagesRead && s.pagesRead > 0 && s.durationMinutes && s.durationMinutes > 0)
  const bestPace = validPaces.length > 0 
    ? Math.min(...validPaces.map(s => (s.durationMinutes || 0) / (s.pagesRead || 1)))
    : 0

  const formatPaceVal = (mpp: number) => {
    if (!mpp || isNaN(mpp)) return '-'
    const mins = Math.floor(mpp)
    const secs = Math.round((mpp - mins) * 60)
    return `${mins}:${secs.toString().padStart(2, '0')} /hlm`
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran gambar maksimal adalah 2MB!")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorStr(null)

    if (editBio.length > 500) {
      setErrorStr("Biografi tidak boleh melebihi 500 karakter.")
      return
    }

    startTransition(async () => {
      const res = await updateProfile({
        name: editName,
        image: editImage,
        location: editLocation,
        bio: editBio
      })

      if (res.success) {
        setIsEditOpen(false)
        router.refresh()
      } else {
        setErrorStr(res.error || "Gagal memperbarui profil.")
      }
    })
  }

  const handleFollowToggle = () => {
    const nextState = !isFollowingState
    setIsFollowingState(nextState)
    setFollowerCountState(prev => nextState ? prev + 1 : Math.max(0, prev - 1))

    startFollowTransition(async () => {
      try {
        const res = await toggleFollow(user.id)
        if (!res.success) {
          setIsFollowingState(!nextState)
          setFollowerCountState(prev => !nextState ? prev + 1 : Math.max(0, prev - 1))
        } else {
          router.refresh()
        }
      } catch {
        setIsFollowingState(!nextState)
        setFollowerCountState(prev => !nextState ? prev + 1 : Math.max(0, prev - 1))
      }
    })
  }

  const avatarPresets = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  ]

  return (
    <div className="bg-gray-50/50 min-h-screen pb-24 font-sans" id="profile-client-root">
      
      {/* Header Profil */}
      <div className="flex justify-between items-center py-4 px-6 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
        {user.isMe ? (
          <>
            <h1 className="text-lg font-black text-gray-900 tracking-tight">Profil Anda</h1>
            <form action={logoutAction}>
              <button 
                type="submit"
                className="p-1.5 bg-gray-50 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                title="Keluar"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <>
            <Link 
              href="/" 
              className="inline-flex items-center gap-1 text-xs font-black text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest"
            >
              <ChevronLeft className="w-5 h-5 text-[#FF6321] -ml-1" />
              <span>Beranda</span>
            </Link>
            <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Profil Pembaca</h1>
            <div className="w-10"></div>
          </>
        )}
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Detail Kartu Pengguna */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-4 relative">
          
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-orange-500 to-orange-400 border-4 border-white shadow-xl overflow-hidden relative group">
            {user.image ? (
              <img src={user.image} alt={user.name || ''} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#FF6321] flex items-center justify-center text-white text-3xl font-black">
                {user.name?.[0]?.toUpperCase() || 'P'}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-gray-900 leading-tight">
              {user.name}
            </h2>
            {user.location ? (
              <p className="text-xs text-[#FF6321] font-bold flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {user.location}
              </p>
            ) : (
              <p className="text-xs text-gray-400 font-medium">Lokasi tidak disebutkan</p>
            )}
          </div>

          <p className="text-xs text-gray-500 font-semibold leading-relaxed max-w-xs px-2 italic">
            {user.bio ? user.bio : 'Belum ada biografi yang dibagikan. Ceritakan kesukaan membagikan petualangan membacamu!'}
          </p>

          {/* Pengikut/Mengikuti */}
          <div className="flex items-center gap-8 border-y border-gray-50 py-3 w-full justify-center text-center">
            <Link 
              href={`/profile/connections?userId=${user.id}&tab=following`}
              className="hover:opacity-80 transition-opacity cursor-pointer block"
            >
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">MENGIKUTI</p>
              <p className="text-base font-black text-gray-900">{user.followingCount}</p>
            </Link>
            <div className="w-px h-6 bg-gray-100"></div>
            <Link 
              href={`/profile/connections?userId=${user.id}&tab=followers`}
              className="hover:opacity-80 transition-opacity cursor-pointer block"
            >
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">PENGIKUT</p>
              <p className="text-base font-black text-gray-900">{followerCountState}</p>
            </Link>
          </div>

          {/* Tombol Aksi */}
          {user.isMe ? (
            <div className="flex flex-col gap-2.5 w-full">
              <div className="flex items-center gap-2.5 w-full">
                <button
                  onClick={() => setIsQrOpen(true)}
                  className="flex-1 py-3 bg-[#FF6321] hover:bg-orange-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-orange-100"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Bagikan QR Code</span>
                </button>
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-black flex items-center justify-center gap-2 border border-gray-100 active:scale-95 transition-all"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profil</span>
                </button>
              </div>
              
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2.5 active:scale-95 transition-all shadow-md"
              >
                <Clock className="w-4 h-4 text-[#FF6321] shrink-0" />
                <span>Histori Membaca Pribadi</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={handleFollowToggle}
                disabled={isFollowTransitionPending}
                className={cn(
                  "w-full py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md border shrink-0 flex items-center justify-center gap-2",
                  isFollowingState 
                    ? "bg-gray-150 border-transparent text-gray-500 hover:bg-gray-255" 
                    : "bg-[#FF6321] border-[#FF6321] text-white hover:bg-orange-600 shadow-orange-100"
                )}
              >
                {isFollowingState ? 'Diikuti' : 'Ikuti'}
              </button>
              
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="w-full py-3 bg-gray-950 hover:bg-gray-900 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2.5 active:scale-95 transition-all shadow-sm"
              >
                <BookOpen className="w-4 h-4 text-[#FF6321] shrink-0" />
                <span>Lihat Histori Membaca</span>
              </button>
            </div>
          )}
        </div>

        {/* Grafik Fluktuasi Progres Mingguan */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400 shrink-0" />
              <h3 className="text-sm font-black text-gray-900">Progres Mingguan</h3>
            </div>
            <span className="text-[10px] bg-orange-50 text-[#FF6321] font-black uppercase px-2 py-0.5 rounded-md">
              7 Hari Terakhir
            </span>
          </div>

          <p className="text-[11px] text-gray-400 font-medium leading-normal">
            Fluktuasi durasi membaca buku Anda dalam satuan menit per hari.
          </p>

          {/* Render High-Performance, Pixel-Perfect Responsive SVG Chart */}
          <div className="relative pt-4 pb-2 w-full flex justify-center">
            <svg className="w-full h-44 overflow-visible" viewBox="0 0 350 160">
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6321" />
                  <stop offset="100%" stopColor="#FF8550" />
                </linearGradient>
                <linearGradient id="activeBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF4100" />
                  <stop offset="100%" stopColor="#FF6321" />
                </linearGradient>
              </defs>

              {/* Grid Background Lines */}
              <line x1="15" y1="20" x2="335" y2="20" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="15" y1="60" x2="335" y2="60" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="15" y1="100" x2="335" y2="100" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="15" y1="130" x2="335" y2="130" stroke="#f3f4f6" strokeWidth="1.5" />

              {last7DaysData.map((day, idx) => {
                const maxVal = Math.max(...last7DaysData.map(d => d.totalMins), 10)
                const heightFraction = day.totalMins / maxVal
                const barHeight = Math.max(day.totalMins > 0 ? 6 : 2, heightFraction * 100)
                const barWidth = 24
                const xPos = 25 + idx * 43
                const yPos = 130 - barHeight
                const isToday = idx === 6
                const roundedRad = day.totalMins > 0 ? 5 : 1

                return (
                  <g key={day.dateStr} className="group cursor-pointer">
                    {/* Value Label above Bar if active */}
                    {day.totalMins > 0 && (
                      <text
                        x={xPos + barWidth / 2}
                        y={yPos - 6}
                        textAnchor="middle"
                        className="text-[9px] font-black fill-[#FF6321] group-hover:fill-gray-950 transition-colors"
                      >
                        {day.totalMins}m
                      </text>
                    )}

                    {/* Bar Rect with custom rounded corners */}
                    <rect
                      x={xPos}
                      y={yPos}
                      width={barWidth}
                      height={barHeight}
                      rx={roundedRad}
                      ry={roundedRad}
                      fill={isToday ? "url(#activeBarGrad)" : (day.totalMins > 0 ? "url(#barGrad)" : "#e5e7eb")}
                      className="transition-all duration-300 group-hover:opacity-90 active:scale-95 origin-bottom"
                      data-id={`bar-day-${idx}`}
                    />

                    {/* Day Name underneath */}
                    <text
                      x={xPos + barWidth / 2}
                      y="145"
                      textAnchor="middle"
                      className={cn(
                        "text-[9px] leading-none uppercase tracking-wide",
                        isToday ? "fill-[#FF6321] font-black" : (day.totalMins > 0 ? "fill-gray-700 font-black" : "fill-gray-400 font-bold")
                      )}
                    >
                      {day.dayName}
                    </text>

                    {/* Day Date number underneath */}
                    <text
                      x={xPos + barWidth / 2}
                      y="155"
                      textAnchor="middle"
                      className={cn(
                        "text-[8px] font-bold leading-none",
                        isToday ? "fill-[#FF6321]" : "fill-gray-400"
                      )}
                    >
                      {day.dateNum}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
          
          <div className="flex items-center gap-1.5 justify-center text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50/50 py-1.5 rounded-lg border border-gray-50">
            <span className="w-2 h-2 rounded-full bg-[#FF6321]"></span>
            <span>Rata-Rata: {Math.round(last7DaysData.reduce((acc, d) => acc + d.totalMins, 0) / 7)} Menit / Hari</span>
          </div>
        </div>

        {/* Sorotan & Sesi Terbaik */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
            <Trophy className="w-5 h-5 text-orange-400 shrink-0" />
            <h3 className="text-sm font-black text-gray-900">Pencapaian Terbaik &amp; Sorotan</h3>
          </div>

          <div className="space-y-3.5 divide-y divide-gray-50/50">
            <div className="flex justify-between items-center py-2.5 first:pt-0">
              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-gray-800">Sesi Membaca Terlama</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">REKOR DURASI</p>
              </div>
              <span className="text-base font-black text-[#FF6321]">
                {maxDuration > 0 ? `${maxDuration} menit` : "-"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2.5">
              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-gray-800">Halaman Terbanyak Sekaligus</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">HALAMAN SEKALIGUS</p>
              </div>
              <span className="text-base font-black text-[#FF6321]">
                {maxPages > 0 ? `${maxPages} halaman` : "-"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2.5">
              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-gray-800">Ritme Tercepat</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">KECEPATAN MEMBACA</p>
              </div>
              <span className="text-base font-black text-[#FF6321]">
                {bestPace > 0 ? formatPaceVal(bestPace) : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Statistik Akumulatif */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
            <Award className="w-5 h-5 text-orange-400 shrink-0" />
            <h3 className="text-sm font-black text-gray-900">Statistik (Tahun Ini)</h3>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100/60">
              <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">TOTAL WAKTU MEMBACA</span>
              <p className="text-lg font-black text-gray-900 mt-1">{formatDurationFlexibly(totalSeconds)}</p>
            </div>
            <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100/60">
              <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">TOTAL HALAMAN MEMBACA</span>
              <p className="text-lg font-black text-gray-900 mt-1">{totalPages} hlm</p>
            </div>
          </div>
        </div>

        {/* Lemari Buku */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
            <BookCheck className="w-5 h-5 text-orange-400 shrink-0" />
            <h3 className="text-sm font-black text-gray-900">Lemari Buku</h3>
          </div>
          <div className="flex items-center justify-between py-2 text-xs">
            <div className="space-y-0.5">
              <p className="font-extrabold text-gray-800">Total Buku Terdaftar</p>
              <p className="text-[10px] text-gray-400 font-medium">Setara dengan akumulasi jarak sepatu lari di Strava</p>
            </div>
            <span className="text-base font-black text-[#FF6321] bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
              {booksCount} Buku
            </span>
          </div>
        </div>

      </div>

      {/* QR Code Popover */}
      <AnimatePresence>
        {isQrOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-xs text-center border border-gray-100 shadow-2xl relative space-y-5"
            >
              <button 
                onClick={() => setIsQrOpen(false)}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="pt-2">
                <span className="text-[10px] text-white bg-[#FF6321] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md shadow-orange-100 border border-orange-400">
                  Pembaca Bookstride
                </span>
                <h3 className="text-md font-black text-gray-900 mt-3">{user.name}</h3>
                {user.location && <p className="text-xs text-gray-400 font-medium">{user.location}</p>}
              </div>

              {/* QR Vector Badge */}
              <div className="bg-orange-50 border-2 border-orange-100 p-4 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center relative">
                <svg className="w-full h-full text-gray-800" viewBox="0 0 100 100" fill="none">
                  <rect x="10" y="10" width="22" height="22" rx="3" fill="#FF6321" />
                  <rect x="14" y="14" width="14" height="14" rx="1" fill="white" />
                  <rect x="17" y="17" width="8" height="8" rx="0.5" fill="#FF6321" />

                  <rect x="68" y="10" width="22" height="22" rx="3" fill="#FF6321" />
                  <rect x="72" y="14" width="14" height="14" rx="1" fill="white" />
                  <rect x="75" y="17" width="8" height="8" rx="0.5" fill="#FF6321" />

                  <rect x="10" y="68" width="22" height="22" rx="3" fill="#FF6321" />
                  <rect x="14" y="72" width="14" height="14" rx="1" fill="white" />
                  <rect x="17" y="75" width="8" height="8" rx="0.5" fill="#FF6321" />

                  <rect x="40" y="12" width="6" height="6" rx="1" fill="#FF6321" />
                  <rect x="52" y="15" width="8" height="6" rx="1" fill="#FF6321" />
                  <rect x="42" y="24" width="12" height="6" rx="1" fill="#FF6321" />
                  
                  <rect x="12" y="42" width="6" height="12" rx="1" fill="#FF6321" />
                  <rect x="24" y="44" width="8" height="6" rx="1" fill="#FF6321" />
                  
                  <rect x="44" y="44" width="22" height="22" rx="3" fill="#FF6321" />
                  <rect x="48" y="48" width="14" height="14" rx="1" fill="white" />
                  <circle cx="55" cy="55" r="4" fill="#FF6321" />

                  <rect x="72" y="40" width="12" height="8" rx="1" fill="#FF6321" />
                  <rect x="75" y="52" width="6" height="10" rx="1" fill="#FF6321" />

                  <rect x="40" y="72" width="10" height="6" rx="1" fill="#FF6321" />
                  <rect x="55" y="75" width="8" height="12" rx="1" fill="#FF6321" />
                  <rect x="72" y="72" width="14" height="14" rx="3" fill="#FF6321" />
                </svg>
              </div>

              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest leading-none">
                Pindai untuk membagikan akun pembaca
              </p>

              <button
                onClick={() => setIsQrOpen(false)}
                className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-black transition-colors"
              >
                Selesai
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Drawer */}
      <AnimatePresence>
        {isEditOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex justify-end z-50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-6 space-y-6 overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-400" />
                  <h3 className="text-md font-black text-gray-900">Ubah Profil Pembaca</h3>
                </div>
                <button 
                  onClick={() => setIsEditOpen(false)}
                  className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorStr && (
                <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorStr}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-5 flex-1 flex flex-col">
                
                {/* Upload foto profil */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">
                    Foto Profil (Unggah File Gambar)
                  </label>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {editImage ? (
                        <img src={editImage} alt="Pratinjau" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 py-2 px-4 border border-gray-100 hover:bg-gray-50 text-gray-700 bg-white shadow-sm rounded-xl text-xs font-bold active:scale-95 transition-all"
                    >
                      <Upload className="w-4 h-4 text-[#FF6321]" />
                      <span>Unggah Gambar dari Galeri</span>
                    </button>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-3 border-t border-gray-50 mt-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block ml-1">Atau pilih contoh:</span>
                    <div className="flex gap-1.5">
                      {avatarPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditImage(preset)}
                          className={cn(
                            "w-8 h-8 rounded-full overflow-hidden border transition-all active:scale-95",
                            editImage === preset ? "border-[#FF6321] scale-105" : "border-transparent"
                          )}
                        >
                          <img src={preset} alt={`edit-avatar-${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Nama Pembaca */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">
                    Nama Pembaca
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-transparent rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-[#FF6321] transition-all"
                  />
                </div>

                {/* Lokasi Pembaca */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">
                    Lokasi
                  </label>
                  <input
                    type="text"
                    placeholder="misal: Tangerang, Banten, Indonesia"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-transparent rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-[#FF6321] transition-all"
                  />
                </div>

                {/* Biografi */}
                <div className="space-y-1.5 flex-1 flex flex-col">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                      Biografi
                    </label>
                    <span className={cn(
                      "text-[9px] font-bold tracking-tight",
                      editBio.length > 500 ? "text-red-500" : "text-gray-400"
                    )}>
                      {editBio.length}/500 karakter
                    </span>
                  </div>
                  <textarea
                    placeholder="Ceritakan tentang hobi membacamu, buku kegemaranmu..."
                    maxLength={500}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full flex-1 min-h-[140px] px-3.5 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-[#FF6321] transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Simpan Profil */}
                <div className="pt-4 border-t border-gray-50 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-black transition-all active:scale-95"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-3 bg-[#FF6321] hover:bg-orange-600 text-white rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isPending ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reading History Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex justify-end z-50 backdrop-blur-sm shadow-2xl p-0"
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-6 space-y-6 overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-400 shrink-0" />
                  <h3 className="text-md font-black text-gray-900">
                    {user.isMe ? 'Histori Membaca Pribadi' : `Histori Membaca ${user.name}`}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1.5 hover:bg-gray-55 rounded-full text-gray-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable list of sessions */}
              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF6321] shadow-inner mb-2">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <p className="text-xs font-black text-gray-800 uppercase tracking-widest leading-none">Belum Ada Histori</p>
                    <p className="text-xs text-gray-400 font-medium max-w-xs leading-relaxed mt-1">
                      Belum ada sesi membaca yang tercatat. Sesi membaca yang selesai akan otomatis tercatat dan tampak sebagai jurnal harian di sini.
                    </p>
                  </div>
                ) : (
                  sessions.map((session) => {
                    const sessionDate = new Date(session.createdAt).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })

                    return (
                      <div 
                        key={session.id} 
                        className="bg-gray-50 hover:bg-white border hover:border-orange-200 border-gray-100 rounded-2xl p-4 transition-all duration-300 shadow-sm relative space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] text-[#FF6321] font-black uppercase tracking-wider block mb-1">
                              {sessionDate}
                            </span>
                            <h4 className="text-sm font-black text-gray-900 leading-snug">
                              {session.book.title}
                            </h4>
                          </div>
                        </div>

                        {/* Session Metrics Bar */}
                        <div className="grid grid-cols-3 gap-2 py-2 border-y border-dashed border-gray-100 text-center">
                          <div className="bg-white p-2 rounded-xl border border-gray-150/50">
                            <span className="text-[8px] text-gray-400 font-black uppercase tracking-wider block">Durasi</span>
                            <span className="text-xs font-black text-gray-950 mt-0.5 inline-block">
                              {session.durationMinutes || 0} Menit
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-gray-150/50">
                            <span className="text-[8px] text-gray-400 font-black uppercase tracking-wider block">Halaman</span>
                            <span className="text-xs font-black text-gray-900 mt-0.5 inline-block">
                              {session.pagesRead || 0} hlm
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-gray-150/50">
                            <span className="text-[8px] text-gray-400 font-black uppercase tracking-wider block">Pace</span>
                            <span className="text-xs font-black text-[#FF6321] mt-0.5 inline-block">
                              {session.pacePerPage ? formatPaceVal(session.pacePerPage) : '-'}
                            </span>
                          </div>
                        </div>

                        {/* Extra info: Notes & Locations */}
                        <div className="space-y-2 text-xs">
                          {session.location && (
                            <p className="text-[10px] text-[#FF6321] font-bold flex items-center gap-1 bg-orange-50/40 py-1.5 px-2.5 rounded-lg border border-orange-100 leading-none w-fit">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span>Dibaca di: {session.location}</span>
                            </p>
                          )}

                          {session.note && (
                            <div className="bg-white p-3 rounded-xl border border-gray-100 text-[11px] text-gray-650 leading-relaxed font-semibold italic relative text-gray-500">
                              &ldquo;{session.note}&rdquo;
                            </div>
                          )}

                          {session.photoUrl && (
                            <div className="w-full h-32 rounded-xl overflow-hidden border border-gray-100 relative shadow-sm">
                              <img 
                                src={session.photoUrl} 
                                alt="Foto sesi membaca" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Drawer footer */}
              <div className="pt-4 border-t border-gray-50">
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md shadow-gray-100"
                >
                  Tutup Histori Membaca
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
