// lib/actions/auth-guest.ts
'use server'

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import crypto from "crypto"

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

export async function loginAsGuest() {
  // Ambil atau buat pembaca contoh "Ali Reza"
  let user = await prisma.user.findUnique({
    where: { email: "guest@bookstride.app" }
  })
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Ali Reza",
        username: "alireza",
        email: "guest@bookstride.app",
        location: "Banten, Indonesia",
        bio: "Seorang pembaca setia di Bookstride 📚",
        password: hashPassword("guest123")
      }
    })
  }

  // Set cookie pengguna tamu
  const cookieStore = await cookies()
  cookieStore.set("guest_userId", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 minggu
    path: "/",
  })

  redirect("/")
}

export async function loginWithCredentials(identifier: string, passwordInput: string) {
  const cleanId = identifier.trim().toLowerCase()
  const cleanPass = passwordInput

  if (!cleanId) {
    throw new Error("Email atau Username wajib diisi")
  }
  if (!cleanPass) {
    throw new Error("Password wajib diisi")
  }

  // Cari berdasarkan email atau username
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: cleanId },
        { username: cleanId }
      ]
    }
  })

  // Jika tidak ditemukan
  if (!user) {
    throw new Error("Akun tidak ditemukan. Silakan mendaftar terlebih dahulu.")
  }

  // Cek kecocokan password
  const hashedInput = hashPassword(cleanPass)
  if (user.password && user.password !== hashedInput) {
    throw new Error("Password salah! Silakan coba lagi.")
  }

  // Set cookie login
  const cookieStore = await cookies()
  cookieStore.set("guest_userId", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 minggu
    path: "/",
  })

  redirect("/")
}

export async function registerUser(data: {
  username: string
  email: string
  passwordInput: string
  confirmPasswordInput: string
  location?: string
  bio?: string
  image?: string
}) {
  const cleanEmail = data.email.trim().toLowerCase()
  const cleanUsername = data.username.trim().toLowerCase()

  if (!cleanUsername) {
    return { success: false, error: "Username wajib diisi." }
  }
  // Cek apakah ada karakter spasi atau aneh di username
  if (/\s/.test(cleanUsername)) {
    return { success: false, error: "Username tidak boleh mengandung spasi." }
  }

  if (!cleanEmail) {
    return { success: false, error: "Alamat email wajib diisi." }
  }

  if (!data.passwordInput) {
    return { success: false, error: "Password wajib diisi." }
  }

  if (data.passwordInput !== data.confirmPasswordInput) {
    return { success: false, error: "Konformasi password tidak cocok." }
  }

  // Cek keunikan email
  const existingEmail = await prisma.user.findUnique({
    where: { email: cleanEmail }
  })
  if (existingEmail) {
    return { success: false, error: "Email sudah terdaftar! Silakan login." }
  }

  // Cek keunikan username
  const existingUsername = await prisma.user.findUnique({
    where: { username: cleanUsername }
  })
  if (existingUsername) {
    return { success: false, error: "Username sudah digunakan. Silakan gunakan username lain." }
  }

  try {
    const defaultBio = data.bio || "Seorang pembaca setia di Bookstride 📚"
    
    const newUser = await prisma.user.create({
      data: {
        name: cleanUsername, // Simpan ke name untuk kecocokan kompatibilitas
        username: cleanUsername,
        email: cleanEmail,
        password: hashPassword(data.passwordInput),
        location: data.location || "Banten, Indonesia",
        bio: defaultBio,
        image: data.image || null,
      }
    })

    // Buat pemberitahuan selamat bergabung singkat / greetings
    await prisma.notification.create({
      data: {
        userId: newUser.id,
        title: "Selamat Datang di Bookstride! 🎉",
        content: `Halo ${cleanUsername}, selamat bergabung di komunitas pembaca Bookstride. Catat buku dan progres membacamu seperti layaknya seorang pembaca andal sekarang! 📚🚀`,
        avatarUrl: null
      }
    })

    // Auto login
    const cookieStore = await cookies()
    cookieStore.set("guest_userId", newUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error during registration:", error)
    return { success: false, error: error.message || "Gagal mendaftarkan pembaca baru." }
  }
}

export async function logoutGuest() {
  const cookieStore = await cookies()
  cookieStore.delete("guest_userId")
  redirect("/login")
}
