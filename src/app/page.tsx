import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// イベント一覧を取得する関数
async function getEvents() {
	const { data: events, error } = await supabase
		.from('events')
		.select(`
			*,
			creator:users(name),
			event_dates(date_time)
		`)
		.eq('is_active', true)
		.order('created_at', { ascending: false })

	if (error) {
		console.error('イベント取得エラー:', error)
		return []
	}

	return events
}

export default async function Home() {
	const events = await getEvents()

	return (
		<div className="min-h-screen bg-gray-50">
			{/* ヘッダー */}
			<header className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex justify-between items-center">
						<h1 className="text-2xl font-bold text-gray-900">
							日程調整アプリ
						</h1>
						<Link
							href="/events/new"
							className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
						>
							+ 新規作成
						</Link>
					</div>
				</div>
			</header>

			{/* メインコンテンツ */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-6">
					<h2 className="text-xl font-semibold text-gray-800 mb-2">
						イベント一覧
					</h2>
					<p className="text-gray-600">
						作成された日程調整イベントの一覧です
					</p>
				</div>

				{/* イベント一覧 */}
				{events.length === 0 ? (
					<div className="bg-white rounded-lg shadow p-8 text-center">
						<p className="text-gray-500 mb-4">
							まだイベントが作成されていません
						</p>
						<Link
							href="/events/new"
							className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
						>
							最初のイベントを作成する
						</Link>
					</div>
				) : (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{events.map((event) => (
							<Link
								key={event.id}
								href={`/events/${event.id}`}
								className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
							>
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									{event.title}
								</h3>
								{event.description && (
									<p className="text-gray-600 text-sm mb-4 line-clamp-2">
										{event.description}
									</p>
								)}
								<div className="flex items-center justify-between text-sm text-gray-500">
									<span>作成者: {event.creator?.name || '不明'}</span>
									<span>{event.event_dates?.length || 0}件の候補日</span>
								</div>
								<div className="mt-4 text-xs text-gray-400">
									{new Date(event.created_at).toLocaleDateString('ja-JP', {
										year: 'numeric',
										month: 'long',
										day: 'numeric',
									})}
								</div>
							</Link>
						))}
					</div>
				)}
			</main>
		</div>
	)
}