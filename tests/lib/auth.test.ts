import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loginUser, registerUser } from '@/lib/auth'
import * as sqliteModule from '@/lib/sqlite'

// Mock des modules Next.js
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Mock du module sqlite
vi.mock('@/lib/sqlite', () => ({
  getUserByPhone: vi.fn(),
  createUser: vi.fn(),
  getAllUsers: vi.fn(() => []),
}))

// Mock bcryptjs au niveau du module (factory function pour éviter hoisting issues)
vi.mock('bcryptjs', () => {
  const mockCompareSync = vi.fn()
  return {
    default: {
      compareSync: mockCompareSync,
      hashSync: vi.fn(),
      genSaltSync: vi.fn(),
    },
    compareSync: mockCompareSync,
  }
})

describe('lib/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loginUser', () => {
    it('devrait retourner une erreur si l\'utilisateur n\'existe pas', async () => {
      vi.mocked(sqliteModule.getUserByPhone).mockReturnValue(null)
      
      const result = await loginUser('0612345678', 'password')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('non trouvé')
    })

    it('devrait retourner une erreur si le mot de passe est incorrect', async () => {
      const mockUser = {
        id: '1',
        phone: '0612345678',
        password_hash: '$2b$10$hashedPassword', // Hash bcrypt valide mais différent
        role: 'user',
      }
      vi.mocked(sqliteModule.getUserByPhone).mockReturnValue(mockUser)
      
      // Mock bcrypt.compareSync (utilisé par loginUser)
      const bcrypt = await import('bcryptjs')
      const bcryptDefault = bcrypt.default || bcrypt
      vi.mocked(bcryptDefault.compareSync).mockReturnValue(false)
      
      const result = await loginUser('0612345678', 'wrongPassword')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('incorrect')
    })

    it('devrait créer une session si les identifiants sont corrects', async () => {
      const mockUser = {
        id: '1',
        phone: '0612345678',
        password_hash: '$2b$10$hashedPassword',
        first_name: 'John',
        last_name: 'Doe',
        role: 'user',
      }
      vi.mocked(sqliteModule.getUserByPhone).mockReturnValue(mockUser)
      
      // Mock bcrypt.compareSync (utilisé par loginUser)
      const bcrypt = await import('bcryptjs')
      const bcryptDefault = bcrypt.default || bcrypt
      vi.mocked(bcryptDefault.compareSync).mockReturnValue(true)
      
      const { cookies } = await import('next/headers')
      const mockCookieStore = {
        set: vi.fn(),
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(cookies).mockReturnValue(mockCookieStore as any)
      
      const result = await loginUser('0612345678', 'correctPassword')
      
      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.id).toBe('1')
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'user_id',
        '1',
        expect.objectContaining({
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 7,
        })
      )
    })
  })

  describe('registerUser', () => {
    it('devrait retourner une erreur si le téléphone existe déjà', async () => {
      const mockUser = {
        id: '1',
        phone: '0612345678',
        password_hash: 'hash',
        role: 'user',
      }
      vi.mocked(sqliteModule.getUserByPhone).mockReturnValue(mockUser)
      
      const result = await registerUser('0612345678', 'password', 'John', 'Doe')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('déjà utilisé')
    })

    it('devrait créer un utilisateur si les données sont valides', async () => {
      vi.mocked(sqliteModule.getUserByPhone).mockReturnValue(null)
      
      const mockNewUser = {
        id: '2',
        phone: '0612345678',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'user',
      }
      vi.mocked(sqliteModule.createUser).mockReturnValue(mockNewUser)
      
      const { cookies } = await import('next/headers')
      const mockCookieStore = {
        set: vi.fn(),
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(cookies).mockReturnValue(mockCookieStore as any)
      
      const result = await registerUser('0612345678', 'password123', 'Jane', 'Smith')
      
      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.phone).toBe('0612345678')
      expect(sqliteModule.createUser).toHaveBeenCalled()
    })
  })
})

