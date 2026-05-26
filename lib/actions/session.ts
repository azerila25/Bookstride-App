// lib/actions/session.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/session"

export async function saveReadingSession(data: {
  bookId: string;
  startTime: string | Date;
  endTime: string | Date;
  startPage?: number;
  endPage?: number;
  pagesRead?: number;
  note?: string;
  location?: string;
  photoUrl?: string;
}) {
  const user = await getCurrentUser()
  
  if (!user?.id) {
    console.error("SaveReadingSession: Unauthorized attempt")
    return { success: false, error: "Sesi masuk telah berakhir. Silakan login kembali." }
  }

  const { bookId, note, location, photoUrl } = data
  
  // Ensure we have real Date objects
  const start = new Date(data.startTime)
  const end = new Date(data.endTime)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Format tanggal tidak valid")
  }

  const durationMs = end.getTime() - start.getTime()
  const durationMinutes = Math.max(1, Math.round(durationMs / 60000))
  
  let pagesRead = 0
  let startPage = 1
  let endPage = 1

  if (data.pagesRead !== undefined) {
    pagesRead = data.pagesRead
    startPage = 1
    endPage = 1 + pagesRead
  } else if (data.startPage !== undefined && data.endPage !== undefined) {
    pagesRead = data.endPage - data.startPage
    startPage = data.startPage
    endPage = data.endPage
  }
  
  if (pagesRead < 0) {
    throw new Error("Halaman dibaca tidak boleh kurang dari 0")
  }

  const pacePerPage = pagesRead > 0 ? durationMinutes / pagesRead : 0

  try {
    // Ambil detail buku untuk isi notifikasi
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { title: true }
    })

    const newSession = await prisma.readingSession.create({
      data: {
        userId: user.id,
        bookId,
        startTime: start,
        endTime: end,
        durationMinutes,
        pagesRead,
        pacePerPage,
        startPage,
        endPage,
        note,
        location: location || null,
        photoUrl: photoUrl || null,
      },
    })

    // Buat pemberitahuan aktivitas membaca selesai dalam Bahasa Indonesia!
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Aktivitas Membaca Selesai 📖",
        content: `Sesi membaca Anda untuk buku '${book?.title || "Buku"}' selama ${durationMinutes} menit (${pagesRead} halaman) telah berhasil disimpan!`,
        avatarUrl: user.image || null,
        isRead: false
      }
    })

    revalidatePath("/")
    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("Error saving reading session:", error)
    throw new Error("Gagal menyimpan sesi ke database")
  }
}

export async function toggleKudos(sessionId: string) {
  const user = await getCurrentUser()
  if (!user?.id) {
    return { success: false, error: "Tidak diizinkan" }
  }

  try {
    const existing = await prisma.interaction.findFirst({
      where: {
        userId: user.id,
        sessionId,
        type: "KUDOS"
      }
    })

    if (existing) {
      await prisma.interaction.delete({
        where: { id: existing.id }
      })
    } else {
      await prisma.interaction.create({
        data: {
          userId: user.id,
          sessionId,
          type: "KUDOS"
        }
      })

      // Tambahkan Notifikasi ke pemilik postingan jika bukan diri sendiri
      const sessionOwner = await prisma.readingSession.findUnique({
        where: { id: sessionId },
        select: { userId: true, book: { select: { title: true } } }
      })

      if (sessionOwner && sessionOwner.userId !== user.id) {
        await prisma.notification.create({
          data: {
            userId: sessionOwner.userId,
            title: "Mendapat Kudos 👍",
            content: `${user.name || "Seseorang"} memberikan kudos pada sesi membaca buku Anda '${sessionOwner.book.title}'.`,
            avatarUrl: user.image || null,
            isRead: false
          }
        })
      }
    }

    revalidatePath("/")
    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("Error toggling kudos:", error)
    return { success: false, error: "Gagal memperbarui Kudos" }
  }
}

export async function addComment(sessionId: string, content: string) {
  const user = await getCurrentUser()
  if (!user?.id) {
    return { success: false, error: "Tidak diizinkan" }
  }

  if (!content.trim()) {
    return { success: false, error: "Komentar tidak boleh kosong" }
  }

  try {
    await prisma.interaction.create({
      data: {
        userId: user.id,
        sessionId,
        type: "COMMENT",
        content: content.trim()
      }
    })

    // Tambahkan Notifikasi ke pemilik postingan jika bukan diri sendiri
    const sessionOwner = await prisma.readingSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, book: { select: { title: true } } }
    })

    if (sessionOwner && sessionOwner.userId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: sessionOwner.userId,
          title: "Komentar Baru 💬",
          content: `${user.name || "Seseorang"} mengomentari sesi membaca buku Anda '${sessionOwner.book.title}': "${content.substring(0, 60)}${content.length > 60 ? '...' : ''}"`,
          avatarUrl: user.image || null,
          isRead: false
        }
      })
    }

    revalidatePath("/")
    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("Error adding comment:", error)
    return { success: false, error: "Gagal menyimpan komentar" }
  }
}
