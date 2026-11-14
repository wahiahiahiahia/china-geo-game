import {
  ensurePlayerIdentity,
  invokeGameFunction,
  supabase
} from '../lib/supabase.js'

export async function initializeCloudPlayer() {
  return ensurePlayerIdentity()
}

export async function getTodayChallenge() {
  return invokeGameFunction('today')
}

export async function startTodayChallenge() {
  return invokeGameFunction('start')
}

export async function submitTodayAnswer(questionNumber, coordinates) {
  if (
    !Array.isArray(coordinates) ||
    coordinates.length !== 2 ||
    !Number.isFinite(coordinates[0]) ||
    !Number.isFinite(coordinates[1])
  ) {
    throw new Error('定位坐标无效')
  }

  return invokeGameFunction('submit', {
    question_number: questionNumber,
    guess_coordinates: coordinates
  })
}

export async function getTodayLeaderboard(limit = 50) {
  return invokeGameFunction('leaderboard', { limit })
}

export async function getTodayStats() {
  return invokeGameFunction('stats')
}

export async function signInAdmin(email, password) {
  if (!supabase) throw new Error('Supabase 尚未配置')
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

export async function checkAdminAccess() {
  if (!supabase) throw new Error('Supabase 尚未配置')
  const { data, error } = await supabase.functions.invoke('admin-auth', {
    body: { action: 'status' }
  })
  if (error) throw new Error(data?.error || error.message)
  if (!data?.is_admin) throw new Error('当前账号没有管理员权限')
  return data
}

export async function signOutAdmin() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
