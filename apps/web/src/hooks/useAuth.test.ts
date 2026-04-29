import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from './useAuth'

const mockApiFetch = vi.hoisted(() => vi.fn())
vi.mock('@/lib/api', () => ({ apiFetch: mockApiFetch }))

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})
afterEach(() => { vi.restoreAllMocks() })

describe('useAuth', () => {
  it('starts with loading=true while the token fetch is in flight', () => {
    // Need a stored token so the async /auth/me path runs (otherwise effect exits early)
    localStorage.setItem('auth_token', 'in-flight-token')
    mockApiFetch.mockReturnValue(new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('sets loading=false and user=null when no token is stored', async () => {
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toBeNull()
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it('fetches /auth/me and sets user when a token exists', async () => {
    localStorage.setItem('auth_token', 'valid-token')
    mockApiFetch.mockResolvedValue({
      user: { steamId: '76561198000000001', displayName: 'eyes' },
    })

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.user).toEqual({ steamId: '76561198000000001', displayName: 'eyes' })
    expect(mockApiFetch).toHaveBeenCalledWith('/auth/me')
  })

  it('removes the token and leaves user=null when /auth/me fails', async () => {
    localStorage.setItem('auth_token', 'expired-token')
    mockApiFetch.mockRejectedValue(new Error('Unauthorized'))

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('signOut clears localStorage and sets user to null', async () => {
    localStorage.setItem('auth_token', 'valid-token')
    mockApiFetch.mockResolvedValue({
      user: { steamId: '76561198000000001', displayName: 'eyes' },
    })

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.user).not.toBeNull())

    act(() => { result.current.signOut() })

    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
  })
})
