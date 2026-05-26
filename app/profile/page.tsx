// app/profile/page.tsx
import React from 'react'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { signOut } from '@/auth'
import { logoutGuest } from '@/lib/actions/auth-guest'
import { ProfileClient } from './profile-client'

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<{ userId?: string }>
}) {
  const sessionUser = await getCurrentUser()

  if (!sessionUser) {
    redirect('/login')
  }

  const resolvedSearch = await searchParams
  const targetUserId = resolvedSearch.userId || sessionUser.id
  const isMe = targetUserId === sessionUser.id

  // Retrieve the target profile
  const user = await prisma.user.findUnique({
    where: { id: targetUserId }
  })

  if (!user) {
    redirect('/')
  }

  const booksCount = await prisma.book.count({
    where: { userId: user.id }
  })

  const sessions = await prisma.readingSession.findMany({
    where: { userId: user.id },
    include: {
      book: true
    },
    orderBy: { createdAt: 'desc' }
  })

  // Calculate precise total seconds
  const totalSeconds = sessions.reduce((acc, s) => {
    if (s.endTime && s.startTime) {
      const sDiff = Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000)
      return acc + Math.max(1, sDiff)
    }
    return acc + ((s.durationMinutes || 0) * 60)
  }, 0)

  const totalPages = sessions.reduce((acc, s) => acc + (s.pagesRead || 0), 0)

  // Dynamic Follow/Follower counts from database
  const followingCount = await prisma.follow.count({
    where: { followerId: user.id }
  })
  const followerCount = await prisma.follow.count({
    where: { followingId: user.id }
  })

  // Check if current logged-in user follows this target profile
  const isFollowing = isMe ? false : await prisma.follow.count({
    where: {
      followerId: sessionUser.id,
      followingId: user.id
    }
  }) > 0

  async function logoutAction() {
    'use server'
    try {
      await signOut()
    } catch (e) {
      await logoutGuest()
    }
  }

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        bio: user.bio,
        location: user.location,
        isMe,
        isFollowing,
        followingCount,
        followerCount
      }}
      booksCount={booksCount}
      sessions={sessions}
      totalSeconds={totalSeconds}
      totalPages={totalPages}
      logoutAction={logoutAction}
    />
  )
}
