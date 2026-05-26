// lib/actions/book.ts
'use server'

import { getCurrentUser } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createBook(formData: FormData) {
  const user = await getCurrentUser()
  
  if (!user?.id) {
    return { success: false, error: "Authentication failed. Please login again." }
  }

  const title = formData.get("title") as string
  const author = formData.get("author") as string
  const totalPagesInput = formData.get("totalPages") as string
  const totalPages = parseInt(totalPagesInput, 10)

  if (!title || isNaN(totalPages) || totalPages <= 0) {
    throw new Error("Please provide a valid title and total pages")
  }

  try {
    await prisma.book.create({
      data: {
        title,
        author: author || "Unknown Author",
        totalPages,
        userId: user.id,
      },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error creating book:", error)
    return { success: false, error: "Failed to create book in database" }
  }
}
