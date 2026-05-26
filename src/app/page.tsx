'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase-client'

type Post = {
  id: string
  title: string
  description: string
  price: number
  category: string
  image_url: string | null
  created_at: string
}

export default function Home() {
  const supabase = useMemo(() => createClient(), [])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id,title,description,price,category,image_url,created_at')
        .order('created_at', { ascending: false })

      if (!error) {
        setPosts(data ?? [])
      }

      setLoading(false)
    }

    loadPosts()
  }, [supabase])

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Publicaciones</h1>
        <Link href="/create-post" className="rounded bg-black px-4 py-2 text-white">
          Nueva publicacion
        </Link>
      </div>

      {loading ? (
        <p className="rounded border border-dashed p-6 text-center text-sm text-gray-600">
          Cargando publicaciones...
        </p>
      ) : posts.length === 0 ? (
        <p className="rounded border border-dashed p-6 text-center text-sm text-gray-600">
          Todavia no hay publicaciones. Crea la primera desde "Nueva publicacion".
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="flex flex-col overflow-hidden rounded border bg-white">
              {post.image_url ? (
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="flex h-48 items-center justify-center bg-gray-100 text-sm text-gray-500">
                  Sin imagen
                </div>
              )}

              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold">{post.title}</h2>
                  <span className="whitespace-nowrap text-sm text-gray-500">{post.category}</span>
                </div>

                <p className="line-clamp-3 text-sm text-gray-700">{post.description}</p>

                <div className="mt-auto pt-2 text-base font-semibold">
                  ${Number(post.price).toFixed(2)}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
