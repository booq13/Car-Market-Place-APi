import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createReview, deleteReview, listAllReviews, updateReview } from '../api/reviews'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { extractErrorMessage } from '../lib/api'
import { formatDate } from '../lib/format'
import { RatingStars } from './RatingStars'
import { Spinner } from './Spinner'

export function ReviewsSection({ sellerId, sellerUsername }: { sellerId: number; sellerUsername?: string }) {
  const { isAuthenticated, username } = useAuth()
  const { t, language } = useLanguage()
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', sellerId],
    queryFn: () => listAllReviews(sellerId),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['reviews', sellerId] })

  const createMutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      invalidate()
      setComment('')
      setRating(5)
      toast.success(t('reviews.thankYou'))
    },
    onError: (error) => toast.error(extractErrorMessage(error, t('reviews.createError'))),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: number; rating: number; comment: string }) =>
      updateReview(id, payload),
    onSuccess: () => {
      invalidate()
      setEditingId(null)
      toast.success(t('reviews.updateSuccess'))
    },
    onError: (error) => toast.error(extractErrorMessage(error, t('reviews.updateError'))),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      invalidate()
      toast.success(t('reviews.deleteSuccess'))
    },
    onError: (error) => toast.error(extractErrorMessage(error, t('reviews.deleteError'))),
  })

  if (isLoading) return <Spinner label={t('reviews.loading')} />

  const list = reviews ?? []
  const average = list.length ? list.reduce((sum, r) => sum + r.rating, 0) / list.length : null
  const myReview = list.find((r) => r.reviewer === username)
  const canReview = isAuthenticated && username !== sellerUsername && !myReview

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-900">{t('reviews.title')}</h2>
        {average !== null && (
          <span className="flex items-center gap-1.5 text-sm text-slate-500">
            <RatingStars value={average} /> {average.toFixed(1)} ({list.length})
          </span>
        )}
      </div>

      {list.length === 0 && <p className="text-sm text-slate-500">{t('reviews.empty')}</p>}

      <ul className="flex flex-col gap-3">
        {list.map((review) => (
          <li key={review.id} className="rounded-xl border border-slate-200 bg-white p-4">
            {editingId === review.id ? (
              <EditReviewForm
                initialRating={review.rating}
                initialComment={review.comment}
                submitting={updateMutation.isPending}
                onCancel={() => setEditingId(null)}
                onSubmit={(r, c) => updateMutation.mutate({ id: review.id, rating: r, comment: c })}
              />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{review.reviewer}</span>
                    <RatingStars value={review.rating} />
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(review.created_at, language)}</span>
                </div>
                {review.comment && <p className="mt-2 text-sm text-slate-600">{review.comment}</p>}
                {review.reviewer === username && (
                  <div className="mt-2 flex gap-3 text-xs font-medium">
                    <button onClick={() => setEditingId(review.id)} className="text-indigo-600 hover:underline">
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(t('reviews.confirmDelete'))) deleteMutation.mutate(review.id)
                      }}
                      className="text-rose-600 hover:underline"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      {!isAuthenticated && <p className="text-sm text-slate-500">{t('reviews.needLogin')}</p>}
      {isAuthenticated && username === sellerUsername && (
        <p className="text-sm text-slate-500">{t('reviews.cannotReviewSelf')}</p>
      )}

      {canReview && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate({ seller: sellerId, rating, comment })
          }}
          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <p className="text-sm font-medium text-slate-700">{t('reviews.leaveReview')}</p>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setRating(n)}
                className={`text-2xl leading-none ${n <= rating ? 'text-amber-400' : 'text-slate-300'}`}
                aria-label={t('reviews.starAriaLabel', { n })}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('reviews.commentPlaceholder')}
            rows={3}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {createMutation.isPending ? t('common.sending') : t('reviews.leaveReview')}
          </button>
        </form>
      )}
    </section>
  )
}

function EditReviewForm({
  initialRating,
  initialComment,
  submitting,
  onCancel,
  onSubmit,
}: {
  initialRating: number
  initialComment: string
  submitting: boolean
  onCancel: () => void
  onSubmit: (rating: number, comment: string) => void
}) {
  const { t } = useLanguage()
  const [rating, setRating] = useState(initialRating)
  const [comment, setComment] = useState(initialComment)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(rating, comment)
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => setRating(n)}
            className={`text-2xl leading-none ${n <= rating ? 'text-amber-400' : 'text-slate-300'}`}
            aria-label={t('reviews.starAriaLabel', { n })}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {t('common.save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}
