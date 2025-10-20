'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type EventDate = {
	id: string
	date_time: string
	display_order: number
}

type Props = {
	eventId: string
	dates: EventDate[]
}

export default function ResponseForm({ eventId, dates }: Props) {
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)

	// フォームの状態
	const [userName, setUserName] = useState('')
	const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())

	// 日程の選択/解除
	const toggleDate = (dateId: string) => {
		const newSelected = new Set(selectedDates)
		if (newSelected.has(dateId)) {
			newSelected.delete(dateId)
		} else {
			newSelected.add(dateId)
		}
		setSelectedDates(newSelected)
	}

	// 回答を送信
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		setSuccess(false)
		setLoading(true)

		try {
			// バリデーション
			if (!userName.trim()) {
				throw new Error('名前を入力してください')
			}

			if (selectedDates.size === 0) {
				throw new Error('参加可能な日程を最低1つ選択してください')
			}

			// 開発用：仮のユーザーIDを使用
			// TODO: 認証実装後、実際のユーザーIDを使用
			const { data: testUser } = await supabase
				.from('users')
				.select('id')
				.eq('slack_user_id', 'U87654321')
				.single()

			// 回答データを作成
			const responses = dates.map(date => ({
				event_date_id: date.id,
				user_id: testUser?.id || null,
				slack_user_id: testUser ? null : 'U_TEMP_' + Date.now(),
				user_name: userName.trim(),
				can_attend: selectedDates.has(date.id),
			}))

			// まず既存の回答を削除（同じユーザーの重複を防ぐ）
			if (testUser?.id) {
				await supabase
					.from('responses')
					.delete()
					.eq('user_id', testUser.id)
					.in('event_date_id', dates.map(d => d.id))
			}

			// 新しい回答を挿入
			const { error: insertError } = await supabase
				.from('responses')
				.insert(responses)

			if (insertError) throw insertError

			setSuccess(true)
			setUserName('')
			setSelectedDates(new Set())

			// ページを再読み込みして最新の状態を表示
			setTimeout(() => {
				router.refresh()
			}, 1000)
		} catch (err) {
			console.error('回答送信エラー:', err)
			setError(err instanceof Error ? err.message : 'エラーが発生しました')
		} finally {
			setLoading(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{/* エラー表示 */}
			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
					{error}
				</div>
			)}

			{/* 成功表示 */}
			{success && (
				<div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
					回答を送信しました！
				</div>
			)}

			{/* 名前入力 */}
			<div>
				<label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
					あなたの名前
				</label>
				<input
					type="text"
					id="userName"
					value={userName}
					onChange={(e) => setUserName(e.target.value)}
					placeholder="山田太郎"
					className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
					required
				/>
			</div>

			{/* 候補日選択 */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					参加可能な日程
				</label>
				<div className="space-y-2">
					{dates.map((date) => (
						<label
							key={date.id}
							className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
						>
							<input
								type="checkbox"
								checked={selectedDates.has(date.id)}
								onChange={() => toggleDate(date.id)}
								className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
							/>
							<div className="flex-1 text-sm">
								<div className="font-medium text-gray-900">
									{new Date(date.date_time).toLocaleDateString('ja-JP', {
										month: 'short',
										day: 'numeric',
										weekday: 'short',
									})}
								</div>
								<div className="text-gray-600">
									{new Date(date.date_time).toLocaleTimeString('ja-JP', {
										hour: '2-digit',
										minute: '2-digit',
									})}
								</div>
							</div>
						</label>
					))}
				</div>
			</div>

			{/* 送信ボタン */}
			<button
				type="submit"
				disabled={loading}
				className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
			>
				{loading ? '送信中...' : '回答を送信'}
			</button>
		</form>
	)
}