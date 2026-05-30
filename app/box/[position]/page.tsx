import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GarazBox, BoxItem, CATEGORY_COLORS } from '@/lib/types'

export default async function BoxPage({ params }: { params: Promise<{ position: string }> }) {
  const { position: posStr } = await params
  const position = parseInt(posStr, 10)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/box/${position}`)

  const { data: box } = await supabase
    .from('garaz_boxes')
    .select('*')
    .eq('user_id', user.id)
    .eq('position', position)
    .single()

  if (!box) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-gray-500 mb-4">Bedna nenalezena.</p>
          <Link href="/" className="text-amber-700 font-semibold hover:underline">← Zpět na regál</Link>
        </div>
      </div>
    )
  }

  const catColor = CATEGORY_COLORS[(box as GarazBox).category] || '#ffffff'
  const items: BoxItem[] = (box as GarazBox).items ?? []

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-4 md:p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition">← Regál</Link>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="h-2" style={{ background: catColor || '#e5e7eb' }} />

          <div className="p-6">
            {box.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-black/[0.06] text-gray-600 mb-2 inline-block">
                {box.category}
              </span>
            )}
            <h1 className="text-xl font-bold text-gray-800 mb-4">
              {box.title || `Bedna ${position + 1}`}
            </h1>

            {box.image_url && (
              <img
                src={box.image_url}
                alt="foto bedny"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}

            {items.length > 0 ? (
              <div className="space-y-2 mb-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">
                  Obsah ({items.filter(i => i.checked).length}/{items.length} splněno)
                </p>
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="mt-0.5 text-base flex-shrink-0">
                      {item.checked ? '☑' : '☐'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {item.text}
                      </span>
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt="foto položky"
                          className="mt-1 w-20 h-20 object-cover rounded"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-4">Bedna je prázdná.</p>
            )}

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <Link
                href={`/?openBox=${position}`}
                className="flex-1 text-center px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-semibold transition"
              >
                Upravit
              </Link>
              <Link
                href="/"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
              >
                ← Regál
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
