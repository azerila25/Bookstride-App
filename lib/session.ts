// lib/session.ts
import { auth } from "@/auth"
import { cookies } from "next/headers"
import { prisma } from "./prisma"

export type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  // 1. Try NextAuth session
  const session = await auth()
  if (session?.user?.id) {
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    }
  }

  // 2. Try Guest Cookie
  const cookieStore = await cookies()
  const guestUserId = cookieStore.get("guest_userId")?.value

  if (guestUserId) {
    const user = await prisma.user.findUnique({
      where: { id: guestUserId }
    })
    
    if (user) {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      }
    }
  }

  return null
}
