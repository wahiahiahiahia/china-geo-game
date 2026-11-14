import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[Supabase] 未配置 VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY，云端功能暂不可用。'
  )
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null

let identityPromise = null

/**
 * 确保玩家拥有稳定的 Supabase Auth 身份，并在 players 表中建立资料。
 * 匿名身份会保存在当前浏览器；清除浏览器数据或更换设备后无法自动恢复。
 */
export async function ensurePlayerIdentity() {
  if (!supabase) {
    throw new Error('Supabase 尚未配置，请检查 .env.local')
  }

  if (identityPromise) return identityPromise

  identityPromise = (async () => {
    let { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()

    if (sessionError) throw sessionError

    if (!sessionData.session) {
      const { data, error } = await supabase.auth.signInAnonymously()
      if (error) throw error
      sessionData = { session: data.session }
    }

    const user = sessionData.session?.user
    if (!user?.id) {
      throw new Error('无法取得玩家身份，请刷新页面重试')
    }

    const { error: profileError } = await supabase
      .from('players')
      .upsert(
        { id: user.id },
        { onConflict: 'id', ignoreDuplicates: true }
      )

    if (profileError) throw profileError

    return {
      playerId: user.id,
      isAnonymous: Boolean(user.is_anonymous)
    }
  })().catch(error => {
    identityPromise = null
    throw error
  })

  return identityPromise
}

export async function invokeGameFunction(action, payload = {}) {
  if (!supabase) throw new Error('Supabase 尚未配置')

  await ensurePlayerIdentity()

  const { data, error } = await supabase.functions.invoke('challenge-play', {
    body: { action, ...payload }
  })

  if (error) {
    const message = data?.error || error.message || '游戏服务暂时不可用'
    throw new Error(message)
  }

  if (data?.error) throw new Error(data.error)
  return data
}

export async function invokeAdminFunction(action, payload = {}) {
  if (!supabase) throw new Error('Supabase 尚未配置')

  const { data, error } = await supabase.functions.invoke('challenge-admin', {
    body: { action, ...payload }
  })

  if (error) {
    throw new Error(data?.error || error.message || '后台服务暂时不可用')
  }

  if (data?.error) throw new Error(data.error)
  return data
}
