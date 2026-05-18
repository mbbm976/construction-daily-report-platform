import { LegacyDailyReportFormSchema } from '../schemas/dailyReportSchema'
import type { DailyReportFormData } from '../../../types/dailyReport'

export type LegacyDailyReportFieldErrors = Partial<
  Record<keyof DailyReportFormData, string[]>
>

export type LegacyDailyReportValidationResult =
  | {
      success: true
      fieldErrors: LegacyDailyReportFieldErrors
      formErrors: string[]
    }
  | {
      success: false
      fieldErrors: LegacyDailyReportFieldErrors
      formErrors: string[]
    }

export function validateLegacyDailyReportFormData(
  input: DailyReportFormData
): LegacyDailyReportValidationResult {
  const validationResult = LegacyDailyReportFormSchema.safeParse(input)

  if (validationResult.success) {
    return {
      success: true,
      fieldErrors: {},
      formErrors: [],
    }
  }

  const flattenedErrors = validationResult.error.flatten()

  return {
    success: false,
    fieldErrors: flattenedErrors.fieldErrors as LegacyDailyReportFieldErrors,
    formErrors: flattenedErrors.formErrors,
  }
}
