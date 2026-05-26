// app/record/record-client.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Play, Pause, Square, ChevronLeft, Save, Loader2, MapPin, Camera, Image as ImageIcon, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { saveReadingSession } from '@/lib/actions/session'
import { cn } from '@/lib/utils'

interface Book {
  id: string
  title: string
  author: string | null
}

const photoPresets = [
  { label: "Meja Kopi", url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80" },
  { label: "Buku Terbuka Klasik", url: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&auto=format&fit=crop&q=80" },
  { label: "Suasana Alam Hijau", url: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80" },
  { label: "Tumpukan Buku Hangat", url: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=80" },
]

export default function RecordClient({ books }: { books: Book[] }) {
  const router = useRouter()
  const customFileInputRef = useRef<HTMLInputElement>(null)
  
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [time, setTime] = useState(0)
  const [selectedBookId, setSelectedBookId] = useState(books[0]?.id || '')
  const [startTime, setStartTime] = useState<string | null>(null)
  const [showSummaryForm, setShowSummaryForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Custom Media Attachments State
  const [location, setLocation] = useState('Banten, Indonesia')
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState('')
  const [customPhotoUrl, setCustomPhotoUrl] = useState('')

  useEffect(() => {
    if (isActive) {
      document.body.classList.add('hide-bottom-nav')
    } else {
      document.body.classList.remove('hide-bottom-nav')
    }
    return () => {
      document.body.classList.remove('hide-bottom-nav')
    }
  }, [isActive])

  useEffect(() => {
    if (isActive && !isPaused) {
      const interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isActive, isPaused])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return [h, m, s]
      .map((v) => (v < 10 ? '0' + v : v))
      .filter((v, i) => v !== '00' || i > 0)
      .join(':')
  }

  const handleStart = () => {
    if (!selectedBookId) {
      setError("Silakan pilih buku yang ingin dibaca terlebih dahulu!")
      return
    }
    setError(null)
    setIsActive(true)
    setIsPaused(false)
    if (!startTime) {
      setStartTime(new Date().toISOString())
    }
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
  }

  const handleStop = () => {
    setIsActive(false)
    setShowSummaryForm(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran berkas gambar maksimal adalah 2MB!")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setCustomPhotoUrl(reader.result as string)
        setSelectedPhotoUrl('')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFinalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return
    
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    
    if (!startTime) {
      alert("Kesalahan Sistem: Waktu mulai tidak ditemukan.")
      setIsSubmitting(false)
      return
    }

    const pagesRead = parseInt(formData.get('pagesRead') as string)

    if (isNaN(pagesRead) || pagesRead <= 0) {
      alert("Silakan masukkan jumlah halaman membaca yang valid.")
      setIsSubmitting(false)
      return
    }

    const finalPhoto = selectedPhotoUrl || customPhotoUrl || ''

    const data = {
      bookId: selectedBookId,
      startTime: startTime,
      endTime: new Date().toISOString(),
      pagesRead,
      note: formData.get('note') as string,
      location: location,
      photoUrl: finalPhoto,
    }

    try {
      const result = await saveReadingSession(data)
      if (result.success) {
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Gagal mencatatkan aktivitas membaca.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSummaryForm) {
    return (
      <div className="p-6 space-y-6 h-full bg-white max-w-md mx-auto overflow-y-auto pb-16">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Ringkasan Sesi</h1>
          <p className="text-xs text-gray-500 font-medium tracking-tight">Sudah seberapa jauh halaman yang Anda lahap hari ini?</p>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full border border-orange-100 text-[#FF6321] text-xs font-bold">
            Durasi: {formatTime(time)}
          </div>
        </div>

        <form onSubmit={handleFinalSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Berapa Halaman yang Dibaca?</label>
              <input 
                required 
                name="pagesRead" 
                type="number" 
                min={1}
                className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-900 outline-none border-2 border-transparent focus:border-[#FF6321] focus:bg-white transition-all text-sm shadow-sm"
                placeholder="misal: 15"
                autoFocus
              />
            </div>

            {/* Lokasi Membaca */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>Lokasi Membaca</span>
              </label>
              <input 
                name="location" 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="misal: Perpustakaan Daerah"
                className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-900 outline-none border-2 border-transparent focus:border-[#FF6321] focus:bg-white transition-all text-sm"
              />
            </div>

            {/* Gambar Dokumentasi */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>Unggah Foto Dokumentasi</span>
              </label>

              {/* Unggah File */}
              <div className="flex items-center gap-3 bg-gray-50 border border-transparent rounded-2xl p-4 transition-all">
                <div className="w-14 h-14 bg-gray-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-gray-300">
                  {customPhotoUrl ? (
                    <img src={customPhotoUrl} alt="Dokumentasi" className="w-full h-full object-cover" />
                  ) : selectedPhotoUrl ? (
                    <img src={selectedPhotoUrl} alt="Contoh" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => customFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 py-2.5 px-4 bg-white border border-gray-150 hover:bg-gray-100 rounded-xl text-xs font-black shadow-sm active:scale-95 transition-all text-gray-800"
                  >
                    <Upload className="w-4 h-4 text-[#FF6321]" />
                    <span>Pilih Foto dari Galeri</span>
                  </button>
                  <p className="text-[9px] text-gray-400 mt-1 font-bold">Mendukung berkas gambar lokal</p>
                </div>

                <input
                  type="file"
                  ref={customFileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Presets opsi */}
              <div className="pt-2">
                <span className="text-[9px] text-gray-400 font-extrabold block ml-1 uppercase tracking-widest mb-1.5">Atau Pilih Opsi Latar Suasana:</span>
                <div className="grid grid-cols-2 gap-2">
                  {photoPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedPhotoUrl(selectedPhotoUrl === preset.url ? '' : preset.url)
                        setCustomPhotoUrl('')
                      }}
                      className={cn(
                        "flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-xl border text-left text-xs transition-all active:scale-95 duration-150 overflow-hidden",
                        selectedPhotoUrl === preset.url ? "border-[#FF6321] bg-orange-50/50 text-[#FF6321]" : "border-transparent text-gray-600"
                      )}
                    >
                      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                        <img src={preset.url} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-extrabold truncate text-[10px] leading-tight select-none">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Catatan Sesi */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kesan Membaca / Kutipan Favorit</label>
              <textarea 
                name="note" 
                rows={3}
                placeholder="Apa yang Anda pelajari hari ini? Tulis kutipan indah dari buku..."
                className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-900 outline-none border-2 border-transparent focus:border-[#FF6321] focus:bg-white transition-all resize-none shadow-sm text-sm"
              />
            </div>
          </div>

          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full py-4 bg-[#FF6321] text-white rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-100 active:scale-95 transition-transform disabled:opacity-50 text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Menyimpan Sesi...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Selesaikan Membaca</span>
              </>
            )}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-white max-w-md mx-auto" id="record-run-panel">
      {/* Header */}
      <div className="p-6 flex items-center gap-4 border-b border-gray-50">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-400" />
        </button>
        <h2 className="text-base font-black text-gray-900 tracking-tight uppercase">Mulai Sesi Membaca</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12">
        {/* Book Selector */}
        {!isActive && (
          <div className="w-full max-w-xs space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-bold text-center animate-shake">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-center">MEMILIH BUKU</label>
              <div className="relative">
                <select 
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-900 outline-none border-2 border-transparent focus:border-[#FF6321] transition-all appearance-none text-center shadow-sm text-sm"
                >
                  <option value="" disabled>Pilih buku...</option>
                  {books.map(book => (
                    <option key={book.id} value={book.id}>{book.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {isActive && (
          <div className="text-center space-y-1">
            <p className="text-[10px] font-black text-[#FF6321] uppercase tracking-[0.2em]">Sedang Membaca</p>
            <h3 className="text-base font-black text-gray-900 tracking-tight">{books.find(b => b.id === selectedBookId)?.title}</h3>
          </div>
        )}

        {/* Big Timer */}
        <div className="relative">
           <motion.div 
            animate={isActive && !isPaused ? { 
              scale: [1, 1.05, 1],
              opacity: [1, 0.8, 1]
            } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-[80px] font-black text-gray-900 tracking-tighter tabular-nums leading-none font-mono"
           >
            {formatTime(time)}
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8 py-8">
          {!isActive ? (
            <button
              onClick={handleStart}
              className="w-24 h-24 bg-[#FF6321] rounded-full flex items-center justify-center shadow-[0_15px_35px_rgba(255,99,33,0.3)] active:scale-90 transition-all group"
            >
              <Play className="w-10 h-10 text-white ml-2 group-hover:scale-110 transition-transform" fill="currentColor" />
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="w-20 h-10 bg-gray-50 rounded-xl flex items-center justify-center active:scale-95 transition-transform border border-gray-150 text-sm font-bold"
              >
                {isPaused ? <Play className="w-5 h-5 text-gray-950" fill="currentColor" /> : <Pause className="w-5 h-5 text-gray-950" fill="currentColor" />}
              </button>
              <button
                onClick={handleStop}
                className="w-20 h-10 bg-gray-900 rounded-xl flex items-center justify-center active:scale-95 transition-transform shadow-xl shadow-gray-200 text-sm font-bold"
              >
                <Square className="w-5 h-5 text-white" fill="currentColor" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
