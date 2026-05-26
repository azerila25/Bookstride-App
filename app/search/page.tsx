// app/search/page.tsx
import React from 'react'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SearchClient } from './search-client'

export default async function SearchPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect('/login')
  }

  // Get all registered users except current logged in user
  const allUsers = await prisma.user.findMany({
    where: {
      id: { not: currentUser.id }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Get current user's following list to show initial active status
  const followRecords = await prisma.follow.findMany({
    where: { followerId: currentUser.id }
  })
  
  const initialFollowingIds = followRecords.map(f => f.followingId)

  // Clean JSON serialization to prevent any Next.js hydration issues
  const serializedUsers = allUsers.map(u => ({
    id: u.id,
    name: u.name || 'Anonymous',
    email: u.email || '',
    bio: u.bio || 'Pecinta buku',
    location: u.location || 'Indonesia',
    image: u.image || ''
  }))

  return (
    <SearchClient 
      users={serializedUsers} 
      initialFollowingIds={initialFollowingIds} 
    />
  )
}
