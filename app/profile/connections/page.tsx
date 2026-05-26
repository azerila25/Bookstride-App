// app/profile/connections/page.tsx
import React from 'react'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ConnectionsClient } from './connections-client'

export default async function ConnectionsPage({
  searchParams
}: {
  searchParams: Promise<{ userId?: string; tab?: string }>
}) {
  const sessionUser = await getCurrentUser()
  if (!sessionUser) {
    redirect('/login')
  }

  const resolvedParams = await searchParams
  const targetId = resolvedParams.userId || sessionUser.id
  const initialTab = resolvedParams.tab || 'following'

  // Fetch the target profile details
  const targetUser = await prisma.user.findUnique({
    where: { id: targetId }
  })

  if (!targetUser) {
    redirect('/profile')
  }

  // Active Following List
  const followingRecords = await prisma.follow.findMany({
    where: { followerId: targetId }
  })
  const followingIds = followingRecords.map(r => r.followingId)
  const followingUsers = await prisma.user.findMany({
    where: { id: { in: followingIds } }
  })

  // Active Followers List
  const followerRecords = await prisma.follow.findMany({
    where: { followingId: targetId }
  })
  const followerIds = followerRecords.map(r => r.followerId)
  const followerUsers = await prisma.user.findMany({
    where: { id: { in: followerIds } }
  })

  // Which users is the CURRENT LOGGED-IN user following? (To manage active toggle states)
  const curUserFollowingRecords = await prisma.follow.findMany({
    where: { followerId: sessionUser.id }
  })
  const curUserFollowingIds = curUserFollowingRecords.map(r => r.followingId)

  // Serialize lists to prevent hydration bugs
  const serializedFollowingUsers = followingUsers.map(u => ({
    id: u.id,
    name: u.name || 'Anonymous',
    location: u.location || 'Banten, Indonesia',
    image: u.image || '',
    bio: u.bio || 'Pecinta buku'
  }))

  const serializedFollowerUsers = followerUsers.map(u => ({
    id: u.id,
    name: u.name || 'Anonymous',
    location: u.location || 'Banten, Indonesia',
    image: u.image || '',
    bio: u.bio || 'Pecinta buku'
  }))

  return (
    <ConnectionsClient
      targetUser={{
        id: targetUser.id,
        name: targetUser.name || 'User',
        isMe: targetUser.id === sessionUser.id
      }}
      following={serializedFollowingUsers}
      followers={serializedFollowerUsers}
      currentFollowingIds={curUserFollowingIds}
      initialTab={initialTab}
    />
  )
}
