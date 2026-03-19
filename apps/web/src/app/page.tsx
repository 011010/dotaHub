import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          DOTA 2 Replay Hub
        </h1>
        <p className="text-lg mb-8">
          Find clips of you from streamers&apos; games
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/search"
            className="p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <h2 className="text-xl font-semibold mb-2">Search Clips</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Find clips by Steam ID
            </p>
          </Link>
          
          <Link
            href="/streamers"
            className="p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <h2 className="text-xl font-semibold mb-2">Browse Streamers</h2>
            <p className="text-gray-600 dark:text-gray-400">
              See registered Dota 2 streamers
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}