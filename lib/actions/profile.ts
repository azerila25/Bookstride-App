// lib/actions/profile.ts
'use server'

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function updateProfile(data: {
  name?: string
  image?: string
  location?: string
  bio?: string
}) {
  const user = await getCurrentUser()
  if (!user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  // Enforce bio character limit
  let bioVal = data.bio
  if (bioVal && bioVal.length > 500) {
    bioVal = bioVal.substring(0, 500)
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name || undefined,
        image: data.image || undefined,
        location: data.location || null,
        bio: bioVal || null,
      }
    })

    revalidatePath("/")
    revalidatePath("/profile")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating profile:", error)
    return { success: false, error: error.message || "Failed to update profile info" }
  }
}
