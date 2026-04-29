import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthButton } from './AuthButton'

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }))

// next/link renders as a plain <a> in tests
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

beforeEach(() => { vi.clearAllMocks() })

describe('AuthButton', () => {
  it('shows a loading skeleton while auth state resolves', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, signOut: vi.fn() })
    const { container } = render(<AuthButton />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
    expect(screen.queryByText(/sign/i)).toBeNull()
  })

  it('shows Sign in link when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, signOut: vi.fn() })
    render(<AuthButton />)
    const link = screen.getByRole('link', { name: /sign in/i })
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toContain('/auth/steam')
  })

  it('shows display name and Sign out button when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user:    { steamId: '76561198000000001', displayName: 'eyes' },
      loading: false,
      signOut: vi.fn(),
    })
    render(<AuthButton />)
    expect(screen.getByText('eyes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('shows steamId when displayName is absent', () => {
    mockUseAuth.mockReturnValue({
      user:    { steamId: '76561198000000001' },
      loading: false,
      signOut: vi.fn(),
    })
    render(<AuthButton />)
    expect(screen.getByText('76561198000000001')).toBeInTheDocument()
  })

  it('calls signOut when the Sign out button is clicked', () => {
    const signOut = vi.fn()
    mockUseAuth.mockReturnValue({
      user:    { steamId: '123', displayName: 'eyes' },
      loading: false,
      signOut,
    })
    render(<AuthButton />)
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(signOut).toHaveBeenCalledOnce()
  })
})
