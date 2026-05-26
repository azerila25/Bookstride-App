// components/add-book-dialog.tsx
'use client'

import React, { useState } from 'react'
import { createBook } from '@/lib/actions/book'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, X, Book as BookIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AddBookDialog() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    const formData = new FormData(e.currentTarget)
    try {
      const result = await createBook(formData)
      if (result.success) {
        setIsOpen(false)
        router.refresh()
      } else if (result.error) {
        alert(result.error)
      }
    } catch (error: any) {
      console.error(error)
      alert(error.message || "Gagal menambahkan buku.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 group hover:border-[#FF6321] transition-colors h-full"
        id="open-add-book-btn"
      >
        <Plus className="w-6 h-6 text-gray-300 group-hover:text-[#FF6321]" />
        <span className="text-xs font-bold text-gray-400 group-hover:text-[#FF6321] uppercase tracking-widest text-[10px]">Tambah Buku</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[32px] p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute right-6 top-6 p-2 bg-gray-50 rounded-full text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Tambah ke Perpustakaan</h2>
                <p className="text-sm text-gray-500">Buku apa yang sedang Anda baca saat ini?</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Judul Buku</label>
                  <input
                    required
                    name="title"
                    placeholder="misal: Atomic Habits"
                    className="w-full p-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#FF6321] transition-all font-bold text-gray-900 outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Penulis Buku</label>
                  <input
                    name="author"
                    placeholder="misal: James Clear"
                    className="w-full p-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#FF6321] transition-all font-bold text-gray-900 outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Total Halaman</label>
                  <input
                    required
                    type="number"
                    name="totalPages"
                    placeholder="320"
                    className="w-full p-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#FF6321] transition-all font-bold text-gray-900 outline-none text-sm"
                  />
                </div>

                <button
                  disabled={isPending}
                  type="submit"
                  className="w-full py-4 bg-[#FF6321] text-white rounded-2xl font-black uppercase tracking-[0.1em] shadow-xl shadow-orange-100 active:scale-95 transition-transform disabled:opacity-50 text-sm"
                  id="submit-book-btn"
                >
                  {isPending ? "Menambahkan..." : "Tambah ke Perpustakaan"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
