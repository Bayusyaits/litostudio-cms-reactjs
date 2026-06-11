import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardSkeleton } from '@/components/atoms/Skeleton'

// Auth pages
const LoginPage             = lazy(() => import('@/modules/auth/LoginPage'))
const RegisterPage          = lazy(() => import('@/modules/auth/RegisterPage'))
const ForgotPasswordPage    = lazy(() => import('@/modules/auth/ForgotPasswordPage'))
const ResetPasswordPage     = lazy(() => import('@/modules/auth/ResetPasswordPage'))
const EmailVerificationPage = lazy(() => import('@/modules/auth/EmailVerificationPage'))
const OAuthCallbackPage     = lazy(() => import('@/modules/auth/OAuthCallbackPage'))
const EmailVerifiedPage     = lazy(() => import('@/modules/auth/EmailVerifiedPage'))

// Dashboard pages
const DashboardPage    = lazy(() => import('@/modules/dashboard/DashboardPageContainer'))
const StoriesPage      = lazy(() => import('@/modules/stories/StoriesPageContainer'))
const StoryFormPage    = lazy(() => import('@/modules/stories/StoryFormContainer'))
const JournalPage      = lazy(() => import('@/modules/journal/JournalPageContainer'))
const JournalFormPage  = lazy(() => import('@/modules/journal/JournalFormContainer'))
const GalleryPage      = lazy(() => import('@/modules/gallery/GalleryPageContainer'))
const MediaPage        = lazy(() => import('@/modules/media/MediaPageContainer'))
const DestinationsPage = lazy(() => import('@/modules/destinations/DestinationsPageContainer'))
const TeamPage         = lazy(() => import('@/modules/team/TeamPageContainer'))
const SettingsPage     = lazy(() => import('@/modules/settings/SettingsPageContainer'))
const CategoriesPage   = lazy(() => import('@/modules/taxonomy/CategoriesPageContainer'))
const TagsPage         = lazy(() => import('@/modules/taxonomy/TagsPageContainer'))
const ThemesPage       = lazy(() => import('@/modules/themes/ThemesPageContainer'))
const NavigationPage   = lazy(() => import('@/modules/navigation/NavigationPageContainer'))
const PagesPage        = lazy(() => import('@/modules/pages/PagesPageContainer'))
const ProductsPage        = lazy(() => import('@/modules/products/ProductsPageContainer'))
const ProductsFormPage    = lazy(() => import('@/modules/products/ProductsFormContainer'))
const CollectionsPage     = lazy(() => import('@/modules/collections/CollectionsPageContainer'))
const CollectionsFormPage = lazy(() => import('@/modules/collections/CollectionsFormContainer'))
const ReviewsPage      = lazy(() => import('@/modules/reviews/ReviewsPageContainer'))
const FaqsPage         = lazy(() => import('@/modules/faqs/FaqsPageContainer'))
const OrganizationsPage = lazy(() => import('@/modules/organizations/OrganizationsPageContainer'))
const AddonsPage        = lazy(() => import('@/modules/addons/AddonsPageContainer'))

function PageLoader() {
  return (
    <div className="p-6">
      <DashboardSkeleton />
    </div>
  )
}

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login',              element: <S><LoginPage /></S> },
      { path: 'register',           element: <S><RegisterPage /></S> },
      { path: 'forgot-password',    element: <S><ForgotPasswordPage /></S> },
      { path: 'reset-password',     element: <S><ResetPasswordPage /></S> },
      { path: 'email-verification', element: <S><EmailVerificationPage /></S> },
      { path: 'auth/callback',      element: <S><OAuthCallbackPage /></S> },
      // Supabase email confirmation links redirect to /auth/verify
      { path: 'auth/verify',        element: <S><EmailVerifiedPage /></S> },
    ],
  },
  {
    element: <DashboardLayout />,
    children: [
      { path: 'dashboard',         element: <S><DashboardPage /></S> },
      { path: 'stories',           element: <S><StoriesPage /></S> },
      { path: 'stories/new',       element: <S><StoryFormPage /></S> },
      { path: 'stories/:id/edit',  element: <S><StoryFormPage /></S> },
      { path: 'journal',           element: <S><JournalPage /></S> },
      { path: 'journal/new',       element: <S><JournalFormPage /></S> },
      { path: 'journal/:id/edit',  element: <S><JournalFormPage /></S> },
      { path: 'gallery',           element: <S><GalleryPage /></S> },
      { path: 'media',             element: <S><MediaPage /></S> },
      { path: 'destinations',      element: <S><DestinationsPage /></S> },
      { path: 'team',              element: <S><TeamPage /></S> },
      { path: 'settings',          element: <S><SettingsPage /></S> },
      { path: 'categories',        element: <S><CategoriesPage /></S> },
      { path: 'tags',              element: <S><TagsPage /></S> },
      { path: 'themes',            element: <S><ThemesPage /></S> },
      { path: 'navigation',        element: <S><NavigationPage /></S> },
      { path: 'pages',             element: <S><PagesPage /></S> },
      { path: 'products',               element: <S><ProductsPage /></S> },
      { path: 'products/new',           element: <S><ProductsFormPage /></S> },
      { path: 'products/:id/edit',      element: <S><ProductsFormPage /></S> },
      { path: 'collections',            element: <S><CollectionsPage /></S> },
      { path: 'collections/new',        element: <S><CollectionsFormPage /></S> },
      { path: 'collections/:id/edit',   element: <S><CollectionsFormPage /></S> },
      { path: 'reviews',           element: <S><ReviewsPage /></S> },
      { path: 'faqs',              element: <S><FaqsPage /></S> },
      { path: 'organizations',     element: <S><OrganizationsPage /></S> },
      { path: 'addons',            element: <S><AddonsPage /></S> },
      { path: '*',                 element: <Navigate to="/dashboard" replace /> },
    ],
  },
])
