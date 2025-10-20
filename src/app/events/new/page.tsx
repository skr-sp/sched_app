'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function NewEventPage() {
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// フォームの状態
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [dates, setDates] = useState<string[]>([''])

	// 候補日を追加
	const addDate = () => {
		setDates([...dates, ''])
	}

	// 候補日を削除
	const removeDate = (index: number) => {
		setDates(dates.filter((_, i) => i !== index))
	}

	// 候補日を更新
	const updateDate = (index: number, value: string) => {
		const newDates = [...dates]
		newDates[index] = value
		setDates(newDates)
	}

	// イベント作成
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		setLoading(true)

		try {
			// バリデーション
			if (!title.trim()) {
				throw new Error('タイトルを入力してください')
			}

			const validDates = dates.filter(d => d.trim() !== '')
			if (validDates.length === 0) {
				throw new Error('候補日を最低1つ入力してください')
			}

			// 開発用：仮のユーザーIDを使用（後で認証を実装）
			// TODO: 認証実装後、実際のユーザーIDを使用
			const { data: testUser } = await supabase
				.from('users')
				.select('id')
				.eq('slack_user_id', 'U12345678')
				.single()

			if (!testUser) {
				throw new Error('ユーザーが見つかりません')
			}

			// イベント作成
			const { data: event, error: eventError } = await supabase
				.from('events')
				.insert({
					title: title.trim(),
					description: description.trim() || null,
					creator_id: testUser.id,
					share_link: `/e/${generateShortId()}`,
				})
				.select()
				.single()

			if (eventError) throw eventError

			// 候補日を作成
			const eventDates = validDates.map((dateStr, index) => ({
				event_id: event.id,
				date_time: new Date(dateStr).toISOString(),
				display_order: index + 1,
			}))

			const { error: datesError } = await supabase
				.from('event_dates')
				.insert(eventDates)

			if (datesError) throw datesError

			// 成功：イベント詳細ページへリダイレクト
			router.push(`/events/${event.id}`)
		} catch (err) {
			console.error('イベント作成エラー:', err)
			setError(err instanceof Error ? err.message : 'エラーが発生しました')
		} finally {
			setLoading(false)
		}
	}

	// 短縮ID生成（簡易版）
	const generateShortId = () => {
		return Math.random().toString(36).substring(2, 9)
	}

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
							新規イベント作成
						</h1>
					</div>
				</div>
			</header>

			{/* メインコンテンツ */}
			<main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
					{/* エラー表示 */}
					{error && (
						<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
							{error}
						</div>
					)}

					{/* タイトル */}
					<div>
						<label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
							イベント名 <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="例: 新年会2025"
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							required
						/>
					</div>

					{/* 説明 */}
					<div>
						<label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
							説明（任意）
						</label>
						<textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="イベントの詳細を入力してください"
							rows={4}
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>

					{/* 候補日時 */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							候補日時 <span className="text-red-500">*</span>
						</label>
						<div className="space-y-3">
							{dates.map((date, index) => (
								<div key={index} className="flex gap-2">
									<input
										type="datetime-local"
										value={date}
										onChange={(e) => updateDate(index, e.target.value)}
										className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										required
									/>
									{dates.length > 1 && (
										<button
											type="button"
											onClick={() => removeDate(index)}
											className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
										>
											削除
										</button>
									)}
								</div>
							))}
						</div>
						<button
							type="button"
							onClick={addDate}
							className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
						>
							+ 候補日を追加
						</button>
					</div>

					{/* 送信ボタン */}
					<div className="flex gap-4 pt-4">
						<button
							type="submit"
							disabled={loading}
							className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
						>
							{loading ? '作成中...' : 'イベントを作成'}
						</button>
						<Link
							href="/"
							className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
						>
							キャンセル
						</Link>
					</div>
				</form>
			</main>
		</div>
	)
}