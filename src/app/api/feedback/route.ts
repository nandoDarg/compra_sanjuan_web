import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FEEDBACK_RECIPIENT = 'nandodclavijo@gmail.com'

type FeedbackType = 'suggestion' | 'problem' | 'feature' | 'other'

const VALID_TYPES: FeedbackType[] = ['suggestion', 'problem', 'feature', 'other']

const TYPE_LABELS: Record<FeedbackType, string> = {
  suggestion: 'Sugerencia',
  problem: 'Reportar un problema',
  feature: 'Solicitar una funcion',
  other: 'Otro',
}

type FeedbackRequest = {
  type?: string
  message?: string
  anonimo?: boolean
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

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as FeedbackRequest | null

    if (!body?.message?.trim()) {
      return NextResponse.json({ error: 'El mensaje es obligatorio.' }, { status: 400 })
    }

    if (!body.type || !VALID_TYPES.includes(body.type as FeedbackType)) {
      return NextResponse.json({ error: 'Tipo de mensaje invalido.' }, { status: 400 })
    }

    const anonimo = body.anonimo !== false
    const supabase = await buildServerClient()

    let userId: string | null = null
    let nombre: string | null = null
    let email: string | null = null

    if (!anonimo) {
      // La identidad se obtiene siempre de la sesion server-side; nunca se confia en datos enviados por el cliente
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json(
          { error: 'Debes iniciar sesion para enviar feedback identificado.' },
          { status: 401 }
        )
      }

      userId = user.id
      email = user.email ?? null

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, full_name')
        .eq('user_id', user.id)
        .maybeSingle()

      nombre = profile?.display_name ?? profile?.full_name ?? email
    }

    const { error: insertError } = await supabase.from('feedback').insert({
      type: body.type,
      message: body.message.trim(),
      anonimo,
      user_id: userId,
      nombre,
      email,
    })

    if (insertError) {
      console.error('[feedback] insert error:', insertError)
      return NextResponse.json(
        { error: 'No se pudo guardar la sugerencia. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    if (RESEND_API_KEY) {
      try {
        const resend = new Resend(RESEND_API_KEY)

        const autorSection = anonimo
          ? 'Mensaje enviado de forma anonima.'
          : `Autor:\n${nombre}\n\nEmail:\n${email}`

        await resend.emails.send({
          from: 'Trato Hecho SJ <onboarding@resend.dev>',
          to: FEEDBACK_RECIPIENT,
          subject: '[Nueva sugerencia] Trato Hecho San Juan',
          text: [
            `Fecha: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/San_Juan' })}`,
            `Tipo: ${TYPE_LABELS[body.type as FeedbackType]}`,
            '',
            'Mensaje:',
            body.message.trim(),
            '',
            autorSection,
          ].join('\n'),
        })
      } catch (emailError) {
        // El email falla silenciosamente: el feedback ya fue guardado en Supabase
        console.error('[feedback] email error:', emailError)
      }
    }

    return NextResponse.json({ message: 'Sugerencia enviada correctamente.' })
  } catch (error) {
    console.error('[feedback] unexpected error:', error)
    return NextResponse.json({ error: 'Ocurrio un error inesperado.' }, { status: 500 })
  }
}
