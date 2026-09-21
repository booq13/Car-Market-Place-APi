export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Car {
  id: number
  owner?: string
  owner_id: number | null
  brand: string
  model: string
  year: number
  price: string
  mileage: number
  description: string
  is_active: boolean
  is_vip: boolean
}

export interface CarImage {
  id: number
  image_url: string
  is_main: boolean
}

export interface CarPayload {
  brand: string
  model: string
  year: number
  price: string
  mileage: number
  description: string
  is_active: boolean
  is_vip?: boolean
}

export interface Profile {
  username: string
  email: string
  phone: string | null
  city: string
  avatar: string | null
  is_premium: boolean
  avg_rating: number | null
}

export interface Favorite {
  id: number
  car: number
  created_at: string
}

export interface Review {
  id: number
  reviewer: string
  seller: number
  rating: number
  comment: string
  created_at: string
}

export interface ReviewPayload {
  seller: number
  rating: number
  comment: string
}

export interface SubscriptionStatus {
  plan: 'free' | 'premium'
  status: string
  expires_at: string | null
  is_premium: boolean
  active_listings_count: number
  max_active_listings: number | null
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface ApiErrorShape {
  detail?: string
  error?: string
  [field: string]: unknown
}
