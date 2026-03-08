import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mbrpsuigifafoytpxxnp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icnBzdWlnaWZhZm95dHB4eG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTU0MTIsImV4cCI6MjA4ODI3MTQxMn0.X9te_qbLh3DPLWGSvz-LIv8ZpbfxsH6lVbajxu1mVME'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

export type UserProfile = {
  id: string
  email: string
  username: string
  membership: 'free' | 'premium'
  credits: number
  avatar?: string
}

export type Project = {
  id: string
  title: string
  description: string
  style: string
  status: string
  cover?: string
  created_at: string
  chapters?: Chapter[]
}

export type Chapter = {
  id: string
  project_id: string
  chapter_num: number
  title: string
  script: string
  frames?: Frame[]
}

export type Frame = {
  id: string
  chapter_id: string
  frame_num: number
  dialogue: string
  speaker: string
  emotion: string
  action: string
  scene: string
  image_url?: string
}

// Storage-based data persistence (no DB tables needed)
const BUCKET = 'manju-data'

export async function saveUserData(userId: string, key: string, data: unknown) {
  const path = `${userId}/${key}.json`
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true })
  
  if (error) {
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`manju_${userId}_${key}`, JSON.stringify(data))
    }
    return false
  }
  return true
}

export async function loadUserData(userId: string, key: string) {
  const path = `${userId}/${key}.json`
  
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(path)
  
  if (error || !data) {
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(`manju_${userId}_${key}`)
      return local ? JSON.parse(local) : null
    }
    return null
  }
  
  const text = await data.text()
  return JSON.parse(text)
}
