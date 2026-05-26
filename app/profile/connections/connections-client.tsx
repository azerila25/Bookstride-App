// app/profile/connections/connections-client.tsx
'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleFollow } from '@/lib/actions/follow-actions'
import { ChevronLeft, MapPin, User, Check, Plus } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ConnectionUser {
  id: string
  name: string
  location: string
  image: string
  bio: string
}

interface TargetUser {
  id: string
  name: string
  isMe: boolean
}

interface ConnectionsClientProps {
  targetUser: TargetUser
  following: ConnectionUser[]
  followers: ConnectionUser[]
  currentFollowingIds: string[]
  initialTab: string
}

export function ConnectionsClient({
  targetUser,
  following,
  followers,
  currentFollowingIds,
  initialTab
}: ConnectionsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>(
    initialTab === 'followers' ? 'followers' : 'following'
  )
  const [followingIds, setFollowingIds] = useState<string[]>(currentFollowingIds)
  const [isPending, startTransition] = useTransition()

  // Handle follow toggle within connection list
  const handleFollowToggle = (userId: string) => {
    const isCurrentlyFollowing = followingIds.includes(userId)
    if (isCurrentlyFollowing) {
      setFollowingIds(followingIds.filter(id => id !== userId))
    } else {
      setFollowingIds([...followingIds, userId])
    }

    startTransition(async () => {
      try {
        const res = await toggleFollow(userId)
        if (!res.success) {
          // Revert optimistic state on error
          if (isCurrentlyFollowing) {
            setFollowingIds(prev => [...prev, userId])
          } else {
            setFollowingIds(prev => prev.filter(id => id !== userId))
          }
        } else {
          router.refresh()
        }
      } catch (err) {
        console.error("Failed to toggle follow in connection panel", err)
      }
    })
  }

  const activeList = activeTab === 'following' ? following : followers

  return (
    <div className="bg-gray-50/50 min-h-screen pb-24 font-sans font-sans" id="connections-view">
      
      {/* Connections Header mirroring Page 3 */}
      <div className="flex justify-between items-center py-4 px-6 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
        <Link 
          href={targetUser.isMe ? "/profile" : `/profile?userId=${targetUser.id}`}
          className="inline-flex items-center gap-1 text-xs font-black text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest"
        >
          <ChevronLeft className="w-5 h-5 text-[#FF6321] -ml-1" />
          <span>Profile</span>
        </Link>
        <span className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">
          Connections
        </span>
        <div className="w-14"></div> {/* Balance spacing offset */}
      </div>

      {/* Tabs list with modern visual indicators */}
      <div className="bg-white border-b border-gray-100">
        <div className="flex max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('following')}
            className={cn(
              "flex-1 text-center py-4 text-xs font-black uppercase tracking-widest transition-all relative",
              activeTab === 'following' ? "text-gray-950" : "text-gray-400 hover:text-gray-700"
            )}
            id="tab-following-btn"
          >
            Following ({following.length})
            {activeTab === 'following' && (
              <span className="absolute bottom-0 left-12 right-12 h-0.5 bg-[#FF6321]"></span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('followers')}
            className={cn(
              "flex-1 text-center py-4 text-xs font-black uppercase tracking-widest transition-all relative",
              activeTab === 'followers' ? "text-gray-950" : "text-gray-400 hover:text-gray-700"
            )}
            id="tab-followers-btn"
          >
            Followers ({followers.length})
            {activeTab === 'followers' && (
              <span className="absolute bottom-0 left-12 right-12 h-0.5 bg-[#FF6321]"></span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        
        {/* Dynamic header display */}
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
          {activeTab === 'following' ? "READERS YOU ARE FOLLOWING" : "READERS FOLLOWING YOU"}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
          {activeList.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <User className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-xs font-bold uppercase tracking-widest">
                No {activeTab === 'following' ? 'following' : 'followers'} listed
              </p>
              {activeTab === 'following' && targetUser.isMe && (
                <div className="mt-4">
                  <Link 
                    href="/search" 
                    className="inline-flex py-2 px-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#FF6321] font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors"
                  >
                    Find readers to follow
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 divide-y divide-gray-50/60">
              {activeList.map((user, idx) => {
                const isFollowing = followingIds.includes(user.id)
                return (
                  <div key={user.id} className={cn("flex items-center justify-between", idx > 0 && "pt-4")}>
                    
                    {/* Interactive credentials */}
                    <Link 
                      href={`/profile?userId=${user.id}`}
                      className="flex items-center gap-3 hover:opacity-85 transition-opacity flex-1 min-w-0"
                    >
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 shadow-sm">
                        {user.image ? (
                          <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#FF6321] font-black text-sm">{user.name[0]}</span>
                        )}
                      </div>
                      
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] font-bold text-[#FF6321] flex items-center gap-0.5 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                          <span>{user.location}</span>
                        </p>
                      </div>
                    </Link>

                    {/* Highly aesthetic toggle button matching Page 3 */}
                    {targetUser.isMe && (
                      <button
                        disabled={isFollowing}
                        onClick={() => !isFollowing && handleFollowToggle(user.id)}
                        className={cn(
                          "rounded-full text-xs font-black px-4 py-1.5 transition-all shadow-sm border shrink-0",
                          isFollowing 
                            ? "bg-gray-100 border-transparent text-gray-400 cursor-not-allowed opacity-75" 
                            : "bg-white border-[#FF6321] text-[#FF6321] hover:bg-orange-50 active:scale-95"
                        )}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                    
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
