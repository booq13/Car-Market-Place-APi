import { type FormEvent, useState } from 'react'
import type { Car, CarPayload } from '../types'
import { useLanguage } from '../i18n/LanguageContext'

interface CarFormProps {
  initial?: Car
  isPremium: boolean
  submitting: boolean
  submitLabel: string
  onSubmit: (payload: CarPayload) => void
}

export function CarForm({ initial, isPremium, submitting, submitLabel, onSubmit }: CarFormProps) {
  const { t } = useLanguage()
  const [brand, setBrand] = useState(initial?.brand ?? '')
  const [model, setModel] = useState(initial?.model ?? '')
  const [year, setYear] = useState(String(initial?.year ?? new Date().getFullYear()))
  const [price, setPrice] = useState(initial?.price ?? '')
  const [mileage, setMileage] = useState(String(initial?.mileage ?? 0))
  const [description, setDescription] = useState(initial?.description ?? '')
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [isVip, setIsVip] = useState(initial?.is_vip ?? false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      brand: brand.trim(),
      model: model.trim(),
      year: Number(year),
      price: price.trim(),
      mileage: Number(mileage),
      description: description.trim(),
      is_active: isActive,
      is_vip: isVip,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {t('carForm.brand')}
          <input
            required
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {t('carForm.model')}
          <input
            required
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {t('carForm.year')}
          <input
            required
            type="number"
            min={1900}
            max={new Date().getFullYear() + 1}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {t('carForm.mileage')}
          <input
            required
            type="number"
            min={0}
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
          {t('carForm.price')}
          <input
            required
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        {t('carForm.description')}
        <textarea
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
        {t('carForm.activeLabel')}
      </label>

      <label
        className={`flex items-center gap-2 text-sm font-medium ${isPremium ? 'text-slate-700' : 'text-slate-400'}`}
        title={isPremium ? undefined : t('carForm.vipTooltip')}
      >
        <input
          type="checkbox"
          checked={isVip}
          disabled={!isPremium}
          onChange={(e) => setIsVip(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        {t('carForm.vipLabel')}
        {!isPremium && t('carForm.vipNeedsPremium')}
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 self-start rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
      >
        {submitting ? t('common.saving') : submitLabel}
      </button>
    </form>
  )
}
