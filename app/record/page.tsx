// app/record/page.tsx
import { getCurrentUser } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import RecordClient from "./record-client"

export default async function RecordPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const books = await prisma.book.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      title: true,
      author: true,
    }
  })

  // If no books, maybe redirect to home to add one?
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center space-y-6 bg-white">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-4xl text-gray-300">📚</span>
        </div>
        <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter">No Books Found</h2>
            <p className="text-sm text-gray-500">You need to add a book to your library before you can start tracking.</p>
        </div>
        <a 
            href="/"
            className="w-full py-4 bg-[#FF6321] text-white rounded-2xl font-black uppercase tracking-wider"
        >
            Go Back Home
        </a>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen">
      <RecordClient books={books} />
    </div>
  )
}
