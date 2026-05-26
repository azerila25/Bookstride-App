// app/notifications/page.tsx
import React from 'react'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ChevronLeft, Bell, BookOpen, UserPlus, Heart, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'Baru saja'
  if (diffMins < 60) return `${diffMins} menit yang lalu`
  if (diffHours < 24) return `${diffHours} jam yang lalu`
  if (diffDays === 1) return 'Kemarin'
  return `${diffDays} hari yang lalu`
}

export default async function NotificationsPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect('/login')
  }

  // Ambil semua notifikasi untuk pengguna yang sedang aktif (sebelum kita update isRead di database)
  const notifications = await prisma.notification.findMany({
    where: { userId: currentUser.id },
    orderBy: { createdAt: 'desc' }
  })

  // Setelah data diambil, tandai yang belum dibaca (isRead: false) menjadi dibaca (isRead: true) di database
  await prisma.notification.updateMany({
    where: { userId: currentUser.id, isRead: false },
    data: { isRead: true }
  })

  return (
    <div className="bg-gray-50/50 min-h-screen pb-24 font-sans" id="notifications-view">
      {/* Header Notifikasi */}
      <div className="flex justify-between items-center py-4 px-6 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1 text-xs font-black text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest"
        >
          <ChevronLeft className="w-5 h-5 text-[#FF6321] -ml-1" />
          <span>Beranda</span>
        </Link>
        <span className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">
          Notifikasi
        </span>
        <div className="w-14"></div> {/* Balance spacer */}
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
          Kabar &amp; Notifikasi Terbaru
        </p>

        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-xs font-bold uppercase tracking-widest">Belum Ada Notifikasi</p>
              <p className="text-xs text-gray-400 mt-1">Aktivitas membaca dan pengikut baru akan muncul di sini.</p>
            </div>
          ) : (
            <div className="space-y-4 divide-y divide-gray-50/60">
              {notifications.map((notif, idx) => {
                // Pilih icon yang cocok
                let IconComponent = Bell
                let iconBg = 'bg-orange-50 text-[#FF6321]'
                
                if (notif.title.includes('Membaca') || notif.title.includes('Aktivitas')) {
                  IconComponent = BookOpen
                  iconBg = 'bg-blue-50 text-blue-500'
                } else if (notif.title.includes('Pengikut') || notif.title.includes('Follow') || notif.title.includes('Ikuti')) {
                  IconComponent = UserPlus
                  iconBg = 'bg-green-50 text-green-500'
                } else if (notif.title.includes('Kudos') || notif.title.includes('kudos') || notif.title.includes('Like')) {
                  IconComponent = Heart
                  iconBg = 'bg-red-50 text-red-500'
                } else if (notif.title.includes('Komentar') || notif.title.includes('Komentar Baru') || notif.title.includes('mengomentari')) {
                  IconComponent = MessageSquare
                  iconBg = 'bg-indigo-50 text-indigo-500'
                }

                // Cek apakah fresh (belum dibaca sebelumnya)
                const isFresh = notif.isRead === false

                return (
                  <div 
                    key={notif.id} 
                    className={cn(
                      "flex items-start gap-3.5 transition-all duration-300",
                      idx > 0 ? "pt-4" : "",
                      isFresh ? "bg-orange-50/40 -mx-3 px-3 py-2.5 rounded-2xl border-l-4 border-l-[#FF6321] shadow-sm shadow-orange-55/10" : "bg-transparent"
                    )}
                  >
                    {/* Lingkaran Avatar / Icon */}
                    <div className="shrink-0">
                      {notif.avatarUrl ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 shadow-sm relative">
                          <img src={notif.avatarUrl} alt="" className="w-full h-full object-cover" />
                          {isFresh && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#FF6321] border-2 border-white rounded-full"></span>
                          )}
                        </div>
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg} border border-transparent relative`}>
                          <IconComponent className="w-4.5 h-4.5" />
                          {isFresh && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#FF6321] border-2 border-white rounded-full"></span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Informasi Konten */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={cn(
                          "text-xs leading-tight",
                          isFresh ? "font-black text-[#FF6321]" : "font-black text-gray-900"
                        )}>
                          {notif.title}
                        </p>
                        {isFresh && (
                          <span className="text-[8px] bg-[#FF6321] text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider scale-90 select-none">BARU</span>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs mt-0.5 leading-relaxed",
                        isFresh ? "text-gray-900 font-bold" : "text-gray-500 font-medium"
                      )}>
                        {notif.content}
                      </p>
                      <span className="text-[9px] text-gray-400 font-bold block mt-1 uppercase tracking-wider">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
