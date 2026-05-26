// app/page.tsx
import React from 'react'
import { Plus, BookOpen, Clock, Layers, Zap, Bell, Search, Info, PlusCircle, UserSearch } from 'lucide-react'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AddBookDialog } from '@/components/add-book-dialog'
import { FeedCard } from '@/components/feed-card'
import { formatDurationFlexibly } from '@/lib/utils'
import Link from 'next/link'

export default async function Home() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  // Ambil buku milik pengguna aktif untuk ditampilkan di rak buku
  const userBooks = await prisma.book.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 6
  })

  // Periksa siapa saja yang sedang diikuti oleh pengguna aktif
  const followRecords = await prisma.follow.findMany({
    where: { followerId: user.id }
  })
  const followingIds = followRecords.map(f => f.followingId)

  // Mengambil aktivitas baca milik orang yang diikuti BESERTA aktivitas milik user sendiri (selalu menyertakan user.id)
  const recentSessions = await prisma.readingSession.findMany({
    where: {
      userId: { in: [...followingIds, user.id] }
    },
    include: {
      book: true,
      user: true,
      interactions: {
        include: {
          user: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 15
  })

  // Hitung jumlah notifikasi yang belum dibaca (isRead: false)
  const unreadNotificationsCount = await prisma.notification.count({
    where: {
      userId: user.id,
      isRead: false
    }
  })

  // Hitung total menit membaca milik pengguna aktif sendiri
  const mySessions = await prisma.readingSession.findMany({
    where: { userId: user.id }
  })

  // Hitung total detik membaca dengan presisi
  const totalSeconds = mySessions.reduce((acc, s) => {
    if (s.endTime && s.startTime) {
      const sDiff = Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000)
      return acc + Math.max(1, sDiff)
    }
    return acc + ((s.durationMinutes || 0) * 60)
  }, 0)

  const totalPages = mySessions.reduce((acc, s) => acc + (s.pagesRead || 0), 0)

  return (
    <div className="bg-gray-50/50 min-h-screen pb-24 font-sans" id="home-view">
      {/* Header Utama */}
      <header className="flex justify-between items-center py-4 px-6 border-b border-gray-100 bg-white sticky top-0 z-40 shadow-sm">
        <Link href="/profile" className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 overflow-hidden shadow-inner shrink-0 block">
          {user.image ? (
            <img src={user.image} alt="Profil Anda" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-black text-orange-600 text-[10px]">
              {user.name?.[0] || 'U'}
            </div>
          )}
        </Link>
        
        <h1 className="text-lg font-black text-gray-900 tracking-tighter italic">
          BOOK<span className="text-[#FF6321]">STRIDE</span>
        </h1>

        <div className="flex items-center gap-3">
          <Link href="/search" className="p-1 hover:bg-gray-50 rounded-full transition-colors flex items-center justify-center">
            <Search className="w-5 h-5 text-gray-400" />
          </Link>
          <Link href="/notifications" className="p-1 hover:bg-gray-50 rounded-full transition-colors relative flex items-center justify-center">
            <Bell className="w-5 h-5 text-gray-400" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 text-white bg-[#FF6321] text-[9px] font-black rounded-full w-4.5 h-4.5 flex items-center justify-center border-2 border-white animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-md mx-auto">
        {/* Aktivitas Mingguan Pengguna */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Aktivitas Mingguan Anda
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100 text-center">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">WAKTU</p>
              <p className="text-base font-black text-gray-900 mt-0.5">{formatDurationFlexibly(totalSeconds)}</p>
            </div>
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100 text-center">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">HALAMAN</p>
              <p className="text-base font-black text-gray-900 mt-0.5">{totalPages}</p>
            </div>
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100 text-center">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">BUKU</p>
              <p className="text-base font-black text-gray-900 mt-0.5">{userBooks.length}</p>
            </div>
          </div>
        </div>

        {/* Rak Buku Saya */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Rak Buku Saya
            </h3>
            <span className="text-[10px] text-gray-400 font-medium">
              {userBooks.length} buku
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {userBooks.map((book) => (
              <div 
                key={book.id} 
                className="aspect-[3/4] bg-white border border-gray-100 rounded-2xl flex flex-col items-center justify-between p-3 text-center shadow-sm relative group hover:border-[#FF6321] transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center my-auto">
                  <BookOpen className="w-4 h-4 text-[#FF6321]" />
                </div>
                <div className="w-full">
                  <p className="text-[10px] font-extrabold text-gray-800 line-clamp-2 leading-tight">
                    {book.title}
                  </p>
                  <p className="text-[8px] text-gray-400 font-bold truncate mt-0.5">
                    {book.author || 'Penulis tidak dikenal'}
                  </p>
                </div>
              </div>
            ))}
            
            <div className="aspect-[3/4] flex items-center justify-center">
              <AddBookDialog />
            </div>
          </div>
        </div>

        {/* Aktivitas Teman & Diri Sendiri */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Aktivitas Membaca
            </h3>
            <span className="text-[10px] text-[#FF6321] font-black uppercase tracking-wider">
              Garis Waktu
            </span>
          </div>

          {recentSessions.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
                <UserSearch className="w-6 h-6 text-[#FF6321]" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black text-gray-800">Mulai Catat dan Ikuti Pembaca</p>
                <p className="text-xs text-gray-500 leading-relaxed px-2">
                  Belum ada aktivitas membaca. Catat progres membaca buku Anda lewat tombol <strong>CATAT</strong> di bawah, atau temukan pembaca keren lainnya untuk saling menyemangati!
                </p>
              </div>
              <div className="pt-2">
                <Link 
                  href="/search"
                  className="inline-flex py-3 px-5 bg-[#FF6321] hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-100"
                >
                  <Search className="w-4 h-4" />
                  <span>Temukan Pembaca Buku</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <FeedCard 
                  key={session.id} 
                  session={session} 
                  currentUserId={user.id} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
