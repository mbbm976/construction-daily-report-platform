# Stage 2 Frontend Foundation & Bilingual UI Plan

## Purpose

Stage 2 is focused on building the frontend foundation for the Construction Daily Report & Site Control Platform.

The platform will use Mongolian as the default language and English as an optional interface language for international clients, project owners, and future commercial scalability.

## Stage 2 Main Goals

- Create frontend application foundation
- Connect frontend with Supabase
- Implement authentication flow
- Load current user profile and role
- Build protected dashboard layout
- Prepare role-based navigation
- Implement bilingual UI structure
- Prepare reusable form components for Stage 3 daily report forms
- Prepare service layer for clean Supabase communication
- Prepare frontend for commercial SaaS-style growth

## Technology Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase JavaScript Client
- React Router
- i18next / react-i18next
- Zustand
- react-hook-form
- zod

## Language Strategy

Default language: Mongolian  
Optional language: English

The language system will be built from the beginning so that English can be enabled without major refactoring later.

### Language Principles

- Mongolian is the default interface language.
- English is optional for international clients.
- i18next is the single source of truth for language state.
- Zustand will not store language state.
- Language preference can be stored in localStorage and later synced with `profiles.preferred_language`.
- Database table names, column names, enum values, and RPC function names remain in English.
- UI labels, buttons, status names, validation messages, menu items, and report headings will be translated.

## User Roles

The frontend must support the following roles:

- admin
- project_manager
- site_engineer
- client_representative
- viewer

Important principle:

Frontend role control is only for user experience. Real access control must remain enforced by Supabase RLS and RPC functions.

## Stage 2 Folder Structure

```text
src/
  app/
    App.tsx
    router.tsx

  components/
    layout/
      AppLayout.tsx
      Sidebar.tsx
      Header.tsx
      LanguageToggle.tsx

    guards/
      AuthGuard.tsx
      ActiveProfileGuard.tsx
      RoleGuard.tsx

    form/
      ControlledInput.tsx
      ControlledSelect.tsx
      ControlledTextarea.tsx
      ControlledNumberInput.tsx
      FormSection.tsx
      FormActions.tsx

    ui/
      shadcn components

  pages/
    auth/
      LoginPage.tsx
      AuthCallbackPage.tsx
      ForgotPasswordPage.tsx
      ResetPasswordPage.tsx

    dashboard/
      DashboardPage.tsx

    reports/
      ReportsListPage.tsx
      ReportDetailPage.tsx

    admin/
      AdminUsersPage.tsx
      AdminProjectsPage.tsx

    system/
      AwaitingActivationPage.tsx
      ForbiddenPage.tsx
      NotFoundPage.tsx

  services/
    supabaseClient.ts
    authService.ts
    profileService.ts
    projectService.ts
    reportService.ts

  stores/
    authStore.ts
    projectStore.ts

  locales/
    mn/
      common.json
      auth.json
      dashboard.json
      report.json
      admin.json
      units.json

    en/
      common.json
      auth.json
      dashboard.json
      report.json
      admin.json
      units.json

  types/
    database.types.ts
    auth.ts
    roles.ts
    reports.ts
    common.ts

  lib/
    formatDate.ts
    formatNumber.ts
    constants.ts
