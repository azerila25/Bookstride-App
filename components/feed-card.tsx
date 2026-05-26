// components/feed-card.tsx
'use client'

import React, { useState, useTransition } from 'react'
import { Heart, MessageSquare, Share2, CornerDownRight, Check, MapPin, Send } from 'lucide-react'
import { toggleKudos, addComment } from '@/lib/actions/session'
import { motion, AnimatePresence } from 'motion/react'
import { cn, formatDurationFlexibly } from '@/lib/utils'

interface User {
  id: string
  name: string | null
  image: string | null
  location: string | null
}

interface Book {
  id: string
  title: string
  author: string | null
}

interface Interaction {
  id: string
  type: string
  content: string | null
  userId: string
  user: {
    name: string | null
    image: string | null
  }
}

interface FeedCardProps {
  session: {
    id: string
    startTime: Date
    endTime: Date | null
    durationMinutes: number | null
    pagesRead: number | null
    pacePerPage: number | null
    note: string | null
    location: string | null
    photoUrl: string | null
    createdAt: Date
    user: User
    book: Book
    interactions: Interaction[]
  }
  currentUserId: string
}

export function FeedCard({ session, currentUserId }: FeedCardProps) {
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  const kudos = session.interactions.filter(i => i.type === 'KUDOS')
  const comments = session.interactions.filter(i => i.type === 'COMMENT')
  const hasKudosed = kudos.some(k => k.userId === currentUserId)

  const handleKudos = () => {
    startTransition(async () => {
      await toggleKudos(session.id)
    })
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    startTransition(async () => {
      const res = await addComment(session.id, commentText)
      if (res.success) {
        setCommentText('')
        setShowCommentInput(false)
      } else {
        alert(res.error || 'Gagal mengirimkan komentar')
      }
    })
  }

  const handleShare = () => {
    const text = `Bookstride: ${session.user.name} membaca ${session.pagesRead} halaman untuk buku "${session.book.title}" dalam ${session.durationMinutes} menit!`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Format ritme
  const formatPace = (mpp: number | null) => {
    if (!mpp || isNaN(mpp)) return '0:00'
    const mins = Math.floor(mpp)
    const secs = Math.round((mpp - mins) * 60)
    return `${mins}:${secs.toString().padStart(2, '0')} /hlm`
  }

  // Format tanggal dalam Bahasa Indonesia
  const formatDate = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSecondsOfSession = () => {
    if (session.endTime && session.startTime) {
      return Math.max(1, Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000))
    }
    return (session.durationMinutes || 0) * 60
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4" id={`feed-session-${session.id}`}>
      {/* Profil Pembaca */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-orange-100 to-orange-50 border border-orange-200 overflow-hidden flex items-center justify-center shrink-0">
            {session.user.image ? (
              <img src={session.user.image} alt={session.user.name || 'Pembaca'} className="w-full h-full object-cover" />
            ) : (
              <span className="text-orange-500 font-black text-sm uppercase">{session.user.name?.[0] || 'P'}</span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900 leading-tight">
              {session.user.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 text-gray-400 text-[11px] font-medium">
              <span>{formatDate(session.createdAt)}</span>
              {(session.location || session.user.location) && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-0.5 text-orange-400 font-bold">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {session.location || session.user.location}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Informasi Buku & Kutipan */}
      <div>
        <h3 className="text-base font-black text-gray-900 tracking-tight leading-snug">
          Membaca &quot;{session.book.title}&quot;
        </h3>
        {session.book.author && (
          <p className="text-xs text-gray-400 font-medium mt-0.5">karya {session.book.author}</p>
        )}
        {session.note && (
          <p className="text-sm text-gray-600 font-medium italic mt-2.5 pl-3 border-l-2 border-orange-200">
            &quot;{session.note}&quot;
          </p>
        )}
      </div>

      {/* Tampilan 3 Kolom Statistik */}
      <div className="grid grid-cols-3 gap-2 py-3.5 border-y border-gray-50 bg-gray-50/40 rounded-xl px-2">
        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-0.5">Halaman</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-black text-gray-900">{session.pagesRead || 0}</span>
            <span className="text-[10px] text-gray-400 font-bold">hlm</span>
          </div>
        </div>
        <div className="flex flex-col items-center text-center border-x border-gray-100">
          <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-0.5">Ritme</span>
          <span className="text-lg font-black text-gray-900">{formatPace(session.pacePerPage)}</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-0.5">Waktu</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-black text-gray-900">{formatDurationFlexibly(getSecondsOfSession())}</span>
          </div>
        </div>
      </div>

      {/* Unggahan Foto Dokumentasi */}
      {session.photoUrl && (
        <div className="w-full overflow-hidden rounded-xl border border-gray-100 max-h-56 relative group">
          <img 
            src={session.photoUrl} 
            alt="Dokumentasi membaca" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        </div>
      )}

      {/* Jumlah Kudos & Komentar */}
      {(kudos.length > 0 || comments.length > 0) && (
        <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 px-1 border-b border-gray-50 pb-2">
          <div className="flex items-center gap-1.5">
            {kudos.length > 0 && (
              <span className="flex items-center gap-1 text-orange-400">
                👍 <span className="text-gray-500">{kudos.length} orang memberi kudos</span>
              </span>
            )}
          </div>
          {comments.length > 0 && (
            <span>{comments.length} komentar</span>
          )}
        </div>
      )}

      {/* Tombol Interaksi */}
      <div className="flex items-center gap-2 pt-1" id="social-actions">
        <button
          onClick={handleKudos}
          disabled={isPending}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all active:scale-95",
            hasKudosed 
              ? "bg-orange-50 border-orange-200 text-[#FF6321]" 
              : "bg-white border-gray-100 hover:bg-gray-50 text-gray-500"
          )}
        >
          <Heart className={cn("w-4 h-4", hasKudosed && "fill-current")} />
          <span>Kudos</span>
        </button>

        <button
          onClick={() => setShowCommentInput(!showCommentInput)}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all active:scale-95",
            showCommentInput 
              ? "bg-gray-100 border-gray-200 text-gray-800" 
              : "bg-white border-gray-100 hover:bg-gray-50 text-gray-500"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Balas</span>
        </button>

        <button
          onClick={handleShare}
          className={cn(
            "py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-1 border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all",
            copied ? "bg-green-50 text-green-600 border-green-200" : "bg-white text-gray-500"
          )}
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Daftar Komentar */}
      <AnimatePresence>
        {(showCommentInput || comments.length > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {comments.length > 0 && (
              <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-100 max-h-48 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 text-xs items-start">
                    <div className="w-6 h-6 rounded-full bg-orange-150 shrink-0 flex items-center justify-center font-bold text-[10px] text-orange-600 overflow-hidden">
                      {comment.user.image ? (
                        <img src={comment.user.image} alt={comment.user.name || ''} className="w-full h-full object-cover" />
                      ) : (
                        <span className="uppercase">{comment.user.name?.[0] || 'P'}</span>
                      )}
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1.5 rounded-lg shadow-sm border border-gray-100">
                      <p className="font-extrabold text-gray-800 tracking-tight">{comment.user.name}</p>
                      <p className="text-gray-600 mt-0.5 leading-snug">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Kolom Input Komentar */}
            {showCommentInput && (
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik komentar Anda..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isPending}
                  className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:bg-white focus:border-[#FF6321] transition-all text-sm font-semibold"
                />
                <button
                  type="submit"
                  disabled={isPending || !commentText.trim()}
                  className="px-4 py-2 bg-[#FF6321] text-white rounded-xl text-xs font-bold active:scale-95 transition-transform flex items-center gap-1 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
