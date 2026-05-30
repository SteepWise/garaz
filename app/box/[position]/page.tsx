import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GarazBox, BoxItem, CATEGORY_DARK_COLORS } from '@/lib/types'
import { PhotoLightbox } from './PhotoLightbox'

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
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '16px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)', fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
            ← Regál
          </Link>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            <div style={{ height: 3, background: 'var(--border-subtle)' }} />
            <div style={{ padding: 24 }}>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Bedna {position + 1}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Tato bedna je zatím prázdná.</p>
              <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid #222' }}>
                <Link
                  href={`/?openBox=${position}`}
                  style={{ flex: 1, textAlign: 'center', padding: '12px', background: '#ff6b35', color: '#111', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
                >
                  Upravit
                </Link>
                <Link
                  href="/"
                  style={{ padding: '12px 16px', background: 'var(--bg-surface)', color: 'var(--text-secondary)', borderRadius: 8, fontSize: 14, textDecoration: 'none', border: '1px solid var(--border-subtle)' }}
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

  const colors = CATEGORY_DARK_COLORS[(box as GarazBox).category]
  const borderColor = colors ? colors.border : 'var(--border-subtle)'
  const labelColor = colors ? colors.label : 'var(--text-muted)'
  const items: BoxItem[] = (box as GarazBox).items ?? []
  const ownedCount = items.filter(i => !i.checked).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '16px', paddingBottom: 32 }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <Link href="/" style={{ color: 'var(--text-secondary)', fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          ← Regál
        </Link>

        <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: `2px solid ${borderColor}`, overflow: 'hidden', boxShadow: `0 0 24px ${borderColor}20` }}>
          <div style={{ height: 3, background: borderColor }} />

          <div style={{ padding: 20 }}>
            {box.category && (
              <span style={{ color: labelColor, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, display: 'inline-block', marginBottom: 8 }}>
                {box.category}
              </span>
            )}
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: 0.5 }}>
              {box.title || `Bedna ${position + 1}`}
            </h1>

            {box.image_url && (
              <img
                src={box.image_url}
                alt="foto bedny"
                style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 16, border: '1px solid #333' }}
              />
            )}

            {items.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Obsah ({ownedCount}/{items.length} mám)
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
                      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1, color: item.checked ? '#333' : '#4ecdc4' }}>
                        {item.checked ? '☐' : '☑'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 14, color: item.checked ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          {item.text}
                        </span>
                        {item.image_url && (
                          <PhotoLightbox
                            src={item.image_url}
                            alt="foto položky"
                            thumbClass="mt-2 w-20 h-20 object-cover rounded"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>Bedna je prázdná.</p>
            )}

            <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid #1a1a1a' }}>
              <Link
                href={`/?openBox=${position}`}
                style={{ flex: 1, textAlign: 'center', padding: '14px', background: '#ff6b35', color: '#111', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}
              >
                Upravit
              </Link>
              <Link
                href="/"
                style={{ padding: '14px 18px', background: 'var(--bg-surface)', color: 'var(--text-secondary)', borderRadius: 8, fontSize: 14, textDecoration: 'none', border: '1px solid var(--border-subtle)' }}
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
