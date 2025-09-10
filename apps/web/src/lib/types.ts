export interface Trailer {
  id: string
  video_number: number
  title: string
  description: string
  detailed_description?: string
  price: string
  length: string
  creators: string
  cf_video_uid: string
  cf_thumb_uid: string
  upload_status: 'Complete' | 'Pending' | 'Processing'
  created_at?: string
  updated_at?: string
}

export interface TrailerFilters {
  search?: string
  creator?: string
  price_min?: number
  price_max?: number
  length_min?: number
  length_max?: number
  status?: string
}

export interface ApiResponse<T> {
  count: number
  next?: string
  previous?: string
  results: T[]
}

export interface AuthResponse {
  success: boolean
  message?: string
}

export interface CloudflarePlayerProps {
  uid: string
  autoplay?: boolean
  muted?: boolean
  className?: string
  poster?: string
}

export interface TrailerCardProps {
  trailer: Trailer
  onPreview?: (trailer: Trailer) => void
}

export interface QuickPreviewProps {
  trailer: Trailer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}