import { useEffect, useState } from 'react'
import { mapLegacyDailyReportFormToProductionDraft } from '../features/daily-reports/mappers/legacyDailyReportMapper'
import {
  clearLegacyDailyReportDraft,
  loadLegacyDailyReportDraft,
  saveLegacyDailyReportDraft,
} from '../features/daily-reports/storage/legacyDailyReportDraftStorage'
import {
  validateLegacyDailyReportFormData,
  type LegacyDailyReportValidationResult,
} from '../features/daily-reports/validation/legacyDailyReportValidation'
import {
  createInitialDailyReportFormData,
  type DailyReportFormData,
} from '../types/dailyReport'
import {
  DraftFeedbackBanner,
  FormField,
  ValidationFeedbackBanner,
} from '../features/daily-reports/components/DailyReportFormUi'

type ValidationFeedback = {
  tone: 'warning' | 'error'
  title: string
  description: string
  fieldErrors: LegacyDailyReportValidationResult['fieldErrors']
  formErrors: string[]
}

type DraftFeedback = {
  tone: 'success' | 'info'
  message: string
}

const validationFieldLabels: Partial<
  Record<keyof DailyReportFormData, string>
> = {
  reportDate: 'Огноо',
  projectSiteName: 'Төсөл / site нэр',
  preparedBy: 'Бэлтгэсэн ажилтан',
  shiftType: 'Ээлж',
  shiftStartTime: 'Ээлж эхлэх цаг',
  shiftEndTime: 'Ээлж дуусах цаг',
  weatherCondition: 'Цаг агаар',
  weatherRemarks: 'Цаг агаарын тэмдэглэл',
  manpowerCount: 'Ажилласан хүн хүч',
  workCompleted: 'Хийгдсэн ажил',
  safetyObservation: 'Аюулгүй ажиллагааны ажиглалт',
  equipment: 'Тоног төхөөрөмж',
  attachmentNote: 'Зураг / хавсралт',
  status: 'Тайлангийн төлөв',
}

function getValidationErrorMessages(feedback: ValidationFeedback): string[] {
  const fieldMessages = Object.entries(feedback.fieldErrors).flatMap(
    ([field, messages]) =>
      (messages ?? []).map((message) => {
        const label =
          validationFieldLabels[field as keyof DailyReportFormData] ?? field

        return `${label}: ${message}`
      })
  )

  return [...feedback.formErrors, ...fieldMessages]
}

function DailyReportFormPage() {
  const [formData, setFormData] = useState<DailyReportFormData>(
    () => createInitialDailyReportFormData()
  )
  const [validationFeedback, setValidationFeedback] =
    useState<ValidationFeedback | null>(null)
  const [draftFeedback, setDraftFeedback] = useState<DraftFeedback | null>(null)

  useEffect(() => {
    const savedDraft = loadLegacyDailyReportDraft()

    if (!savedDraft) {
      return
    }

    const timerId = window.setTimeout(() => {
      setFormData(savedDraft.data)
      setDraftFeedback({
        tone: 'info',
        message: `Өмнөх draft сэргээгдлээ. Хадгалсан цаг: ${new Date(
          savedDraft.savedAt
        ).toLocaleString()}.`,
      })
    }, 0)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [])

  const updateField = (
    field: keyof DailyReportFormData,
    value: string | number
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
    setValidationFeedback(null)
    setDraftFeedback(null)
  }

  const showValidationFeedback = (
    validationResult: LegacyDailyReportValidationResult,
    tone: ValidationFeedback['tone'],
    title: string,
    description: string
  ) => {
    if (validationResult.success) {
      setValidationFeedback(null)
      return
    }

    setValidationFeedback({
      tone,
      title,
      description,
      fieldErrors: validationResult.fieldErrors,
      formErrors: validationResult.formErrors,
    })

    console.warn('Legacy daily report validation errors:', {
      fieldErrors: validationResult.fieldErrors,
      formErrors: validationResult.formErrors,
    })
  }

  const handleSaveDraft = () => {
    const draftPayload: DailyReportFormData = {
      ...formData,
      status: 'draft',
    }

    const validationResult = validateLegacyDailyReportFormData(draftPayload)

    showValidationFeedback(
      validationResult,
      'warning',
      'Draft validation warning',
      'Draft хадгалалт үргэлжилнэ. Submit хийхээс өмнө доорх мэдээллийг шалгана уу.'
    )

    // Stage 2.3 migration visibility only: this mapped draft is not a
    // persisted DailyReport. Backend-generated organization, project, report
    // number, entity metadata, and approval fields will be injected later by
    // application/backend workflows.
    const mappedProductionDraft =
      mapLegacyDailyReportFormToProductionDraft(draftPayload)

    const savedDraft = saveLegacyDailyReportDraft(draftPayload)

    setFormData((current) => ({
      ...current,
      status: 'draft',
    }))
    setDraftFeedback({
      tone: savedDraft.persisted ? 'success' : 'info',
      message: savedDraft.persisted
        ? `Draft local browser storage-д хадгалагдлаа. Хадгалсан цаг: ${new Date(
            savedDraft.savedAt
          ).toLocaleString()}.`
        : savedDraft.warning ??
          'Local storage-д draft хадгалах боломжгүй байна.',
    })

    console.log('Draft report:', draftPayload)
    console.log('Mapped production draft:', mappedProductionDraft)
  }

  const handleSubmitReport = () => {
    const submittedPayload: DailyReportFormData = {
      ...formData,
      status: 'submitted',
    }

    const validationResult = validateLegacyDailyReportFormData(submittedPayload)

    showValidationFeedback(
      validationResult,
      'error',
      'Submit validation blocked',
      'Submit хийхийн өмнө доорх алдааг засна уу.'
    )

    if (!validationResult.success) {
      return
    }

    // Stage 2.3 migration visibility only: this mapped submission draft is not
    // a persisted DailyReport. Backend-generated organization, project, report
    // number, entity metadata, and approval fields will be injected later by
    // application/backend workflows.
    const mappedProductionSubmissionDraft =
      mapLegacyDailyReportFormToProductionDraft(submittedPayload)

    clearLegacyDailyReportDraft()

    setFormData((current) => ({
      ...current,
      status: 'submitted',
    }))
    setDraftFeedback({
      tone: 'success',
      message: 'Submit амжилттай боллоо. Local draft цэвэрлэгдлээ.',
    })

    console.log('Submitted report:', submittedPayload)
    console.log(
      'Mapped production submission draft:',
      mappedProductionSubmissionDraft
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-600">
            Барилгын өдөр тутмын тайлан
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Өдөр тутмын тайлангийн форм
          </h1>
          <p className="mt-2 text-slate-600">
            Талбайн өдөр тутмын ажил, хүн хүч, тоног төхөөрөмж, ХАБЭА ажиглалт
            болон тайлангийн төлөвийг бүртгэнэ.
          </p>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Огноо">
              <input
                type="date"
                value={formData.reportDate}
                onChange={(event) =>
                  updateField('reportDate', event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </FormField>

            <FormField label="Төсөл / site нэр">
              <input
                type="text"
                value={formData.projectSiteName}
                onChange={(event) =>
                  updateField('projectSiteName', event.target.value)
                }
                placeholder="Жишээ: Оюу Толгой - Барилгын талбай"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </FormField>

            <FormField label="Бэлтгэсэн ажилтан">
              <input
                type="text"
                value={formData.preparedBy}
                onChange={(event) =>
                  updateField('preparedBy', event.target.value)
                }
                placeholder="Ажилтны нэр"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </FormField>

            <FormField label="Ажилласан хүн хүч">
              <input
                type="number"
                min="0"
                value={formData.manpowerCount}
                onChange={(event) =>
                  updateField('manpowerCount', Number(event.target.value))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </FormField>

            <FormField label="Хийгдсэн ажил" fullWidth>
              <textarea
                value={formData.workCompleted}
                onChange={(event) =>
                  updateField('workCompleted', event.target.value)
                }
                rows={4}
                placeholder="Өнөөдөр хийгдсэн үндсэн ажлуудыг бичнэ үү."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </FormField>

            <FormField label="Аюулгүй ажиллагааны ажиглалт" fullWidth>
              <textarea
                value={formData.safetyObservation}
                onChange={(event) =>
                  updateField('safetyObservation', event.target.value)
                }
                rows={4}
                placeholder="Hazard, near miss, toolbox talk, permit, corrective action гэх мэт мэдээлэл."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </FormField>

            <FormField label="Тоног төхөөрөмж" fullWidth>
              <textarea
                value={formData.equipment}
                onChange={(event) =>
                  updateField('equipment', event.target.value)
                }
                rows={3}
                placeholder="Ашигласан тоног төхөөрөмж, эвдрэл саатал, сул зогсолт."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </FormField>

            <FormField label="Зураг / хавсралт" fullWidth>
              <input
                type="text"
                value={formData.attachmentNote}
                onChange={(event) =>
                  updateField('attachmentNote', event.target.value)
                }
                placeholder="Дараагийн шатанд file upload холбох тул одоогоор тэмдэглэл бичнэ."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </FormField>

            <FormField label="Тайлангийн төлөв">
              <select
                value={formData.status}
                onChange={(event) => updateField('status', event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="draft">Draft</option>
                <option value="submitted">Submit</option>
              </select>
            </FormField>
          </div>

          {draftFeedback ? (
            <DraftFeedbackBanner
              tone={draftFeedback.tone}
              message={draftFeedback.message}
            />
          ) : null}

          {validationFeedback ? (
            <ValidationFeedbackBanner
              tone={validationFeedback.tone}
              title={validationFeedback.title}
              description={validationFeedback.description}
              messages={getValidationErrorMessages(validationFeedback)}
            />
          ) : null}

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Draft хадгалах
            </button>

            <button
              type="button"
              onClick={handleSubmitReport}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Submit хийх
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

export default DailyReportFormPage
