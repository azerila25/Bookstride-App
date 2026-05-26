// lib/actions/follow-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function toggleFollow(targetUserId: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser?.id) {
    return { success: false, error: "Silakan masuk terlebih dahulu" }
  }

  if (currentUser.id === targetUserId) {
    return { success: false, error: "Anda tidak dapat mengikuti diri sendiri" }
  }

  try {
    const existing = await prisma.follow.findFirst({
      where: {
        followerId: currentUser.id,
        followingId: targetUserId
      }
    })

    if (existing) {
      await prisma.follow.delete({
        where: { id: existing.id }
      })
      revalidatePath("/")
      revalidatePath("/profile")
      revalidatePath("/profile/connections")
      return { success: true, followed: false }
    } else {
      await prisma.follow.create({
        data: {
          followerId: currentUser.id,
          followingId: targetUserId
        }
      })
      
      // Kirim notifikasi pasif follow dalam Bahasa Indonesia!
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: "Pengikut Baru 👥",
          content: `${currentUser.name || "Seseorang"} mulai mengikuti Anda di Bookstride!`,
          avatarUrl: currentUser.image || null
        }
      })
      
      revalidatePath("/")
      revalidatePath("/profile")
      revalidatePath("/profile/connections")
      return { success: true, followed: true }
    }
  } catch (error: any) {
    console.error("Error in toggleFollow:", error)
    return { success: false, error: "Terjadi kesalahan database" }
  }
}

export async function checkFollowStatus(targetUserId: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser?.id) return false

  try {
    const existing = await prisma.follow.findFirst({
      where: {
        followerId: currentUser.id,
        followingId: targetUserId
      }
    })
    return !!existing
  } catch {
    return false
  }
}
