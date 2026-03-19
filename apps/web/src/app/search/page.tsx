'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

export default function SearchPage() {
  const [steamId, setSteamId] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ clips: unknown[]; pagination: { total: number } } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!steamId.trim()) return

    setLoading(true)
    setError(null)
    
    try {
      const data = await api.search.bySteamId(steamId)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Search Clips by Steam ID</h1>
        
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              placeholder="Enter your Steam ID"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 mb-4 bg-red-100 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        {results && (
          <div>
            <p className="mb-4 text-gray-600">
              Found {results.pagination.total} clip(s)
            </p>
            <div className="grid gap-4">
              {results.clips.map((clip, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  Clip found
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}