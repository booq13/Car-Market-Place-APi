import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { deleteCarImage, listCarImages, uploadCarImage } from '../api/images'
import { useLanguage } from '../i18n/LanguageContext'
import { extractErrorMessage } from '../lib/api'
import { Spinner } from './Spinner'

export function ImageManager({ carId }: { carId: number }) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isMain, setIsMain] = useState(false)
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null)

  const { data: images, isLoading } = useQuery({
    queryKey: ['car-images', carId],
    queryFn: () => listCarImages(carId),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['car-images', carId] })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadCarImage(carId, file, isMain),
    onSuccess: () => {
      invalidate()
      setIsMain(false)
      toast.success(t('images.uploadSuccess'))
    },
    onError: (error) => toast.error(extractErrorMessage(error, t('images.uploadError'))),
    onSettled: () => {
      setPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (imageId: number) => deleteCarImage(carId, imageId),
    onSuccess: () => {
      invalidate()
      toast.success(t('images.deleteSuccess'))
    },
    onError: (error) => toast.error(extractErrorMessage(error, t('images.deleteError'))),
  })

  // Revoke the object URL whenever it's replaced or the component unmounts,
  // so we don't leak memory across repeated selections.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url)
    }
  }, [preview])

  function handleFileSelected(file: File | undefined) {
    if (!file) return
    setPreview({ url: URL.createObjectURL(file), name: file.name })
    uploadMutation.mutate(file)
  }

  if (isLoading) return <Spinner label={t('images.loading')} />

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700">{t('images.title')}</h2>

      {((images && images.length > 0) || preview) && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images?.map((image) => (
            <div key={image.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200">
              <img src={image.image_url} alt="" className="h-full w-full object-cover" />
              {image.is_main && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {t('images.mainBadge')}
                </span>
              )}
              <button
                onClick={() => {
                  if (confirm(t('images.confirmDelete'))) deleteMutation.mutate(image.id)
                }}
                disabled={deleteMutation.isPending}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-xs text-rose-600 opacity-0 shadow transition group-hover:opacity-100 disabled:opacity-50"
                aria-label={t('images.delete')}
              >
                ✕
              </button>
            </div>
          ))}
          {preview && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200">
              <img src={preview.url} alt={preview.name} className="h-full w-full object-cover opacity-60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/10 text-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                <span className="max-w-[90%] truncate rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                  {preview.name}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
        <label className="flex items-center gap-1.5 text-sm text-slate-600">
          <input type="checkbox" checked={isMain} onChange={(e) => setIsMain(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          {t('images.makeMain')}
        </label>
        <label
          className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
            uploadMutation.isPending
              ? 'cursor-not-allowed bg-slate-200 text-slate-400'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }`}
        >
          {uploadMutation.isPending ? t('common.uploading') : t('images.selectButton')}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploadMutation.isPending}
            onChange={(e) => handleFileSelected(e.target.files?.[0])}
          />
        </label>
      </div>
      <p className="text-xs text-slate-400">{t('images.uploadNote')}</p>
    </div>
  )
}
