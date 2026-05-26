// app/search/search-client.tsx
'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleFollow } from '@/lib/actions/follow-actions'
import { 
  ChevronLeft, Search, User, MapPin, Sparkles, 
  Check, Share2, Mail, Plus, Flame 
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SerializedUser {
  id: string
  name: string
  email: string
  bio: string
  location: string
  image: string
}

interface SearchClientProps {
  users: SerializedUser[]
  initialFollowingIds: string[]
}

export function SearchClient({ users, initialFollowingIds }: SearchClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [followingIds, setFollowingIds] = useState<string[]>(initialFollowingIds)
  const [isPending, startTransition] = useTransition()
  const [inviteSuccess, setInviteSuccess] = useState(false)

  // Filter pembaca berdasarkan query
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      u.location.toLowerCase().includes(q) ||
      u.bio.toLowerCase().includes(q)
    )
  })

  // Aksi ikuti / batalkan ikuti
  const handleFollowToggle = (userId: string) => {
    const isFollowing = followingIds.includes(userId)
    if (isFollowing) {
      setFollowingIds(followingIds.filter(id => id !== userId))
    } else {
      setFollowingIds([...followingIds, userId])
    }

    startTransition(async () => {
      try {
        const res = await toggleFollow(userId)
        if (!res.success) {
          // Kembalikan ke state awal jika gagal
          if (isFollowing) {
            setFollowingIds(prev => [...prev, userId])
          } else {
            setFollowingIds(prev => prev.filter(id => id !== userId))
          }
        } else {
          router.refresh()
        }
      } catch (err) {
        console.error("Gagal mengubah status ikuti", err)
      }
    })
  }

  // Tautan undangan teman
  const handleInvite = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText("https://bookstride.app/invite")
      setInviteSuccess(true)
      setTimeout(() => setInviteSuccess(false), 2000)
    }
  }

  return (
    <div className="bg-gray-50/50 min-h-screen pb-24 font-sans" id="search-container">
      {/* Header Pencarian */}
      <div className="flex justify-between items-center py-4 px-6 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1 text-xs font-black text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest"
          id="search-back-link"
        >
          <ChevronLeft className="w-5 h-5 text-[#FF6321] -ml-1" />
          <span>Beranda</span>
        </Link>
        <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest" id="search-title">
          PENCARIAN
        </h1>
        <div className="w-14"></div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Kolom Pencarian */}
        <div className="relative">
          <input
            type="text"
            placeholder="Cari pembaca buku di Bookstride..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-11 py-3 text-sm bg-white border border-gray-200 rounded-full font-semibold text-gray-900 outline-none focus:border-[#FF6321] focus:ring-1 focus:ring-orange-100 transition-all placeholder:text-gray-400 shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
        </div>

        {/* Kotak Daftar Pembaca */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2 col-title-reader">
            Pembaca Buku Terdaftar
          </p>

          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <User className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-xs font-bold uppercase tracking-widest">Pembaca tidak ditemukan</p>
              <p className="text-xs text-gray-400 mt-1">Coba cari nama atau lokasi lainnya</p>
            </div>
          ) : (
            <div className="space-y-4 divide-y divide-gray-50/60">
              {filteredUsers.map((user, idx) => {
                const isFollowing = followingIds.includes(user.id)
                return (
                  <div 
                    key={user.id} 
                    className={cn(
                      "flex items-center justify-between pt-4 first:pt-0",
                      idx > 0 && "pt-4"
                    )}
                  >
                    {/* Data Pengguna */}
                    <Link 
                      href={`/profile?userId=${user.id}`}
                      className="flex items-center gap-3 hover:opacity-85 transition-opacity flex-1 min-w-0"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 shadow-sm">
                        {user.image ? (
                          <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#FF6321] font-black text-sm uppercase">{user.name[0]}</span>
                        )}
                      </div>
                      
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] font-bold text-[#FF6321] flex items-center gap-0.5 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                          <span>{user.location}</span>
                        </p>
                        <p className="text-xs text-gray-400 font-medium truncate mt-0.5 max-w-[200px]">
                          {user.bio}
                        </p>
                      </div>
                    </Link>

                    {/* Tombol Ikuti */}
                    <button
                      disabled={isFollowing}
                      onClick={() => !isFollowing && handleFollowToggle(user.id)}
                      className={cn(
                        "rounded-full text-xs font-black px-4.5 py-1.5 transition-all shadow-sm border shrink-0 text-center inline-block min-w-[85px]",
                        isFollowing 
                          ? "bg-gray-100 border-transparent text-gray-400 cursor-not-allowed opacity-75 animate-none" 
                          : "bg-white border-[#FF6321] text-[#FF6321] hover:bg-orange-50 active:scale-95"
                      )}
                    >
                      {isFollowing ? 'Diikuti' : 'Ikuti'}
                    </button>
                    
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Bagian Undang Teman */}
        <div className="bg-orange-50/50 rounded-3xl border border-orange-100 p-5 text-center space-y-4 shadow-sm">
          <p className="text-xs font-bold text-gray-650">
            Undang teman yang belum bergabung di Bookstride
          </p>
          <button
            onClick={handleInvite}
            className="w-full py-3 bg-[#FF6321] hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-orange-100"
          >
            <Share2 className="w-4 h-4" />
            <span>{inviteSuccess ? "Tautan Disalin!" : "Undang Teman"}</span>
          </button>
        </div>

      </div>
    </div>
  )
}
