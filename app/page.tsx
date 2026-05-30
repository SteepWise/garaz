import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ShelfClient from './ShelfClient'

export default async function Home({ searchParams }: { searchParams: Promise<{ openBox?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: boxes }, { data: settings }] = await Promise.all([
    supabase.from('garaz_boxes').select('*').eq('user_id', user.id).order('position'),
    supabase.from('garaz_settings').select('*').eq('user_id', user.id).single(),
  ])

  const cols = settings?.cols ?? 5
  const rows = settings?.rows ?? 3
  const total = cols * rows

  const filled = Array.from({ length: total }, (_, i) => {
    const existing = boxes?.find((b: { position: number }) => b.position === i)
    return existing ?? {
      id: null, user_id: user.id, position: i,
      title: `Bedna ${i + 1}`, category: '', items: [], color: '#ffffff', image_url: null,
      created_at: '', updated_at: '',
    }
  })

  const { openBox } = await searchParams
  const openBoxNum = openBox !== undefined ? parseInt(openBox, 10) : undefined

  return <ShelfClient userId={user.id} initialBoxes={filled} cols={cols} rows={rows} openBox={openBoxNum} />
}
