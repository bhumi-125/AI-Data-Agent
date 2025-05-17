import { ChatNonStreaming } from "@/components/chat-non-streaming"
import { Header } from "@/components/header"
import { DatabaseInfo } from "@/components/database-info"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 lg:w-1/4">
          <DatabaseInfo />
        </div>
        <div className="w-full md:w-2/3 lg:w-3/4">
          <ChatNonStreaming />
        </div>
      </main>
    </div>
  )
}
