import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loginUser, registerUser } from '@/lib/auth'

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

// Mock du module sqlite (pour fallback ; les tests privilégient l'adapter)
vi.mock('@/lib/sqlite', () => ({
  getUserByPhone: vi.fn(),
  createUser: vi.fn(),
  getAllUsers: vi.fn(() => []),
  forceConnection: vi.fn(() => false),
  initSqlJsAsync: vi.fn(() => Promise.resolve(false)),
}))

// Mock bcryptjs : compareSync pour login, hash (async) pour register
vi.mock('bcryptjs', () => {
  const mockCompareSync = vi.fn()
  const mockHash = vi.fn().mockResolvedValue('$2a$10$mockedhash')
  return {
    default: {
      compareSync: mockCompareSync,
      hash: mockHash,
      hashSync: vi.fn(() => '$2a$10$mockedhash'),
      genSaltSync: vi.fn(),
    },
    compareSync: mockCompareSync,
    hash: mockHash,
  }
})

// Mock getDatabaseAdapter pour que l'auth utilise l'adapter (évite fallback sqlite)
const mockGetUserByPhone = vi.fn()
const mockCreateUser = vi.fn()
vi.mock('@/lib/db', () => ({
  getDatabaseAdapter: vi.fn(() => Promise.resolve({
    getUserByPhone: mockGetUserByPhone,
    createUser: mockCreateUser,
    getProductById: vi.fn(),
    getProducts: vi.fn(() => []),
    testConnection: vi.fn(() => Promise.resolve(true)),
  })),
}))

describe('lib/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUserByPhone.mockResolvedValue(null)
    mockCreateUser.mockResolvedValue(null)
  })

  describe('loginUser', () => {
    it('devrait retourner une erreur si l\'utilisateur n\'existe pas', async () => {
      mockGetUserByPhone.mockResolvedValue(null)

      const result = await loginUser('0612345678', 'password')

      expect(result.success).toBe(false)
      expect(result.error).toContain('non trouvé')
    })

    it('devrait retourner une erreur si le mot de passe est incorrect', async () => {
      const mockUser = {
        id: '1',
        phone: '0612345678',
        password_hash: '$2b$10$hashedPassword',
        role: 'user',
      }
      mockGetUserByPhone.mockResolvedValue(mockUser)

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
      mockGetUserByPhone.mockResolvedValue(mockUser)

      const bcrypt = await import('bcryptjs')
      const bcryptDefault = bcrypt.default || bcrypt
      vi.mocked(bcryptDefault.compareSync).mockReturnValue(true)

      const result = await loginUser('0612345678', 'correctPassword')

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.id).toBe('1')
      expect(result.user?.phone).toBe('0612345678')
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
      mockGetUserByPhone.mockResolvedValue(mockUser)

      const result = await registerUser('0612345678', 'password', 'John', 'Doe')

      expect(result.success).toBe(false)
      expect(result.error).toContain('déjà utilisé')
    })

    it('devrait créer un utilisateur si les données sont valides', async () => {
      mockGetUserByPhone.mockResolvedValue(null)

      const mockNewUser = {
        id: '2',
        phone: '0612345678',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'user',
      }
      mockCreateUser.mockResolvedValue(mockNewUser)

      const { cookies } = await import('next/headers')
      const mockCookieStore = { set: vi.fn() }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)

      const result = await registerUser('0612345678', 'password123', 'Jane', 'Smith')

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.phone).toBe('0612345678')
      expect(mockCreateUser).toHaveBeenCalled()
    })
  })
})

