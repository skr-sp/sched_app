import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ResponseForm from '@/components/ResponseForm'

// イベント詳細を取得
async function getEvent(id: string) {
	const { data: event, error } = await supabase
		.from('events')
		.select(`
			*,
			creator:users(name, slack_user_id),
			event_dates(
				id,
				date_time,
				display_order,
				responses(
					id,
					user_name,
					can_attend
				)
			)
		`)
		.eq('id', id)
		.single()

	if (error || !event) {
		return null
	}

	// 候補日を表示順にソート
	event.event_dates.sort((a, b) => a.display_order - b.display_order)

	return event
}

export default async function EventDetailPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params
	const event = await getEvent(id)

	if (!event) {
		notFound()
	}

	// 各候補日の参加人数を集計
	const dateStats = event.event_dates.map(date => ({
		...date,
		attendees: date.responses.filter(r => r.can_attend).length,
		total: date.responses.length,
	}))

	return (
		<div className="min-h-screen bg-gray-50">
			{/* ヘッダー */}
			<header className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center gap-4">
						<Link
							href="/"
							className="text-gray-600 hover:text-gray-900"
						>
							← 戻る
						</Link>
						<h1 className="text-2xl font-bold text-gray-900">
							{event.title}
						</h1>
					</div>
				</div>
			</header>

			{/* メインコンテンツ */}
			<main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid gap-6 lg:grid-cols-3">
					{/* イベント情報 */}
					<div className="lg:col-span-2 space-y-6">
						{/* 基本情報 */}
						<div className="bg-white rounded-lg shadow p-6">
							<h2 className="text-lg font-semibold text-gray-900 mb-4">
								イベント情報
							</h2>
							<dl className="space-y-3">
								<div>
									<dt className="text-sm text-gray-500">作成者</dt>
									<dd className="text-gray-900">{event.creator?.name || '不明'}</dd>
								</div>
								{event.description && (
									<div>
										<dt className="text-sm text-gray-500">説明</dt>
										<dd className="text-gray-900 whitespace-pre-wrap">{event.description}</dd>
									</div>
								)}
								{event.share_link && (
									<div>
										<dt className="text-sm text-gray-500">共有リンク</dt>
										<dd className="text-blue-600">
											{`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${event.share_link}`}
										</dd>
									</div>
								)}
							</dl>
						</div>

						{/* 候補日時と参加状況 */}
						<div className="bg-white rounded-lg shadow p-6">
							<h2 className="text-lg font-semibold text-gray-900 mb-4">
								候補日時と参加状況
							</h2>
							<div className="space-y-4">
								{dateStats.map((date) => (
									<div
										key={date.id}
										className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
									>
										<div className="flex justify-between items-start mb-3">
											<div>
												<div className="text-lg font-medium text-gray-900">
													{new Date(date.date_time).toLocaleDateString('ja-JP', {
														year: 'numeric',
														month: 'long',
														day: 'numeric',
														weekday: 'short',
													})}
												</div>
												<div className="text-sm text-gray-600">
													{new Date(date.date_time).toLocaleTimeString('ja-JP', {
														hour: '2-digit',
														minute: '2-digit',
													})}
												</div>
											</div>
											<div className="text-right">
												<div className="text-2xl font-bold text-blue-600">
													{date.attendees}
												</div>
												<div className="text-xs text-gray-500">
													{date.total > 0 ? `${date.total}人中` : '回答なし'}
												</div>
											</div>
										</div>

										{/* 参加者リスト */}
										{date.responses.length > 0 && (
											<div className="mt-3 pt-3 border-t border-gray-100">
												<div className="flex flex-wrap gap-2">
													{date.responses
														.filter(r => r.can_attend)
														.map((response, idx) => (
															<span
																key={idx}
																className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs rounded"
															>
																✓ {response.user_name}
															</span>
														))}
													{date.responses
														.filter(r => !r.can_attend)
														.map((response, idx) => (
															<span
																key={idx}
																className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded"
															>
																✗ {response.user_name}
															</span>
														))}
												</div>
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					</div>

					{/* 回答フォーム */}
					<div className="lg:col-span-1">
						<div className="bg-white rounded-lg shadow p-6 sticky top-4">
							<h2 className="text-lg font-semibold text-gray-900 mb-4">
								参加可能な日程を選択
							</h2>
							<ResponseForm eventId={event.id} dates={event.event_dates} />
						</div>
					</div>
				</div>
			</main>
		</div>
	)
}