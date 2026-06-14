import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPostImagePathFromPublicUrl } from '@/lib/post-images'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

type DeleteAccountRequest = {
  confirmation?: string
}

type UserPostRow = {
  id: string
  image_url: string | null
}

type UserPostImageRow = {
  image_url: string | null
}

type DeleteAccountRpcResult = {
  user_id: string
  deleted_posts: number
  deleted_profile: boolean
}

async function buildServerClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Faltan variables publicas de Supabase en el servidor.')
  }

  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options)
        }
      },
    },
  })
}

function buildAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY para eliminar cuentas de Auth y limpiar Storage.')
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function collectImagePaths(posts: UserPostRow[], galleryImages: UserPostImageRow[]) {
  const uniquePaths = new Set<string>()

  for (const post of posts) {
    const path = getPostImagePathFromPublicUrl(post.image_url)

    if (path) {
      uniquePaths.add(path)
    }
  }

  for (const image of galleryImages) {
    const path = getPostImagePathFromPublicUrl(image.image_url)

    if (path) {
      uniquePaths.add(path)
    }
  }

  return Array.from(uniquePaths)
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as DeleteAccountRequest | null

    if (body?.confirmation !== 'ELIMINAR') {
      return NextResponse.json(
        { error: 'Debes escribir ELIMINAR para confirmar el borrado permanente.' },
        { status: 400 }
      )
    }

    const supabase = await buildServerClient()
    const adminSupabase = buildAdminClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Tu sesion no es valida o expiró. Vuelve a iniciar sesion.' },
        { status: 401 }
      )
    }

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id,image_url')
      .eq('user_id', user.id)

    if (postsError) {
      return NextResponse.json(
        { error: 'No se pudieron preparar las publicaciones para eliminar la cuenta.' },
        { status: 500 }
      )
    }

    const postIds = (posts ?? []).map((post) => post.id)
    let galleryImages: UserPostImageRow[] = []

    if (postIds.length > 0) {
      const { data: postImages, error: postImagesError } = await supabase
        .from('post_images')
        .select('image_url')
        .in('post_id', postIds)

      if (postImagesError) {
        return NextResponse.json(
          { error: 'No se pudieron preparar las imagenes asociadas a la cuenta.' },
          { status: 500 }
        )
      }

      galleryImages = postImages ?? []
    }

    const imagePaths = collectImagePaths(posts ?? [], galleryImages)

    if (imagePaths.length > 0) {
      const { error: storageError } = await adminSupabase.storage.from('post-images').remove(imagePaths)

      if (storageError) {
        return NextResponse.json(
          {
            error: 'No se pudieron eliminar las imagenes asociadas a la cuenta en Storage.',
            code: 'storage_cleanup_failed',
          },
          { status: 500 }
        )
      }
    }

    // Orden auditado: primero Storage para evitar archivos huerfanos, luego borrado relacional en transaccion y por ultimo Auth.
    // Dependencias: posts elimina en cascada post_images y vehicle_details; profiles depende de auth.users.
    // Riesgo residual: si la transaccion SQL falla despues de limpiar Storage, el usuario conserva la cuenta pero debera reintentar con algunas imagenes ya removidas.
    const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_my_account_data')

    if (rpcError) {
      return NextResponse.json(
        {
          error:
            'Las imagenes fueron retiradas de Storage, pero falló la eliminacion relacional de la cuenta. Reintenta la operacion para completar el borrado.',
          code: 'relational_delete_failed',
        },
        { status: 500 }
      )
    }

    const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(user.id)

    if (authDeleteError) {
      return NextResponse.json(
        {
          error:
            'La informacion de la cuenta fue eliminada, pero no se pudo eliminar el usuario de autenticacion. Reintenta la operacion o revisa el panel de Supabase.',
          code: 'auth_delete_failed',
        },
        { status: 500 }
      )
    }

    const deletionResult = (rpcResult ?? null) as DeleteAccountRpcResult | null

    return NextResponse.json({
      message: 'Cuenta eliminada correctamente.',
      deletedPosts: deletionResult?.deleted_posts ?? postIds.length,
      deletedProfile: deletionResult?.deleted_profile ?? true,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Ocurrio un error inesperado al eliminar la cuenta.' },
      { status: 500 }
    )
  }
}