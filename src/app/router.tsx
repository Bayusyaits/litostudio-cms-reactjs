import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardSkeleton } from '@/components/atoms/Skeleton'

// Error / utility pages
const NotFoundPage      = lazy(() => import('@/modules/not-found/NotFoundPage'))
const UnauthorizedPage  = lazy(() => import('@/modules/not-found/UnauthorizedPage'))

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
const JournalPage      = lazy(() => import('@/modules/journal/JournalPageContainer'))
const GalleryPage      = lazy(() => import('@/modules/gallery/GalleryPageContainer'))
const MediaPage        = lazy(() => import('@/modules/media/MediaPageContainer'))
const DestinationsPage = lazy(() => import('@/modules/destinations/DestinationsPageContainer'))
const TeamPage         = lazy(() => import('@/modules/team/TeamPageContainer'))
const SettingsPage     = lazy(() => import('@/modules/settings/SettingsPageContainer'))
const CategoriesPage   = lazy(() => import('@/modules/taxonomy/CategoriesPageContainer'))
const TagsPage         = lazy(() => import('@/modules/taxonomy/TagsPageContainer'))
const ThemesPage       = lazy(() => import('@/modules/themes/ThemesPageContainer'))
const PagesPage        = lazy(() => import('@/modules/pages/PagesPageContainer'))
const PagesNewPage     = lazy(() => import('@/modules/pages/PagesNewPageContainer'))
const ProductsPage     = lazy(() => import('@/modules/products/ProductsPageContainer'))
const CollectionsPage  = lazy(() => import('@/modules/collections/CollectionsPageContainer'))
const ReviewsPage      = lazy(() => import('@/modules/reviews/ReviewsPageContainer'))
const FaqsPage         = lazy(() => import('@/modules/faqs/FaqsPageContainer'))
const OnboardingPage   = lazy(() => import('@/modules/onboarding/OnboardingPage'))
const BlockEditorPage          = lazy(() => import('@/modules/editor/BlockEditorPage'))
const PagePreviewPage          = lazy(() => import('@/modules/editor/PagePreviewPage'))
const SimpleContentEditorPage  = lazy(() => import('@/modules/editor/SimpleContentEditorPage'))
const OrganizationsPage  = lazy(() => import('@/modules/organizations/OrganizationsPageContainer'))
const AddonsPage         = lazy(() => import('@/modules/addons/AddonsPageContainer'))
const ServicesPage       = lazy(() => import('@/modules/services/ServicesPageContainer'))
const TestimonialsPage   = lazy(() => import('@/modules/testimonials/TestimonialsPageContainer'))
const PricingPage        = lazy(() => import('@/modules/pricing/PricingPageContainer'))
const HeroPage           = lazy(() => import('@/modules/hero/HeroPageContainer'))
const CommentsPage       = lazy(() => import('@/modules/comments/CommentsPageContainer'))
const CampaignsPage      = lazy(() => import('@/modules/campaigns/CampaignsPageContainer'))
const SeoPage            = lazy(() => import('@/modules/seo/SeoPageContainer'))
const LabelsPage         = lazy(() => import('@/modules/settings/labels/LabelsPageContainer'))

// Commerce + engagement pages
const OrdersPage         = lazy(() => import('@/modules/orders/OrdersPageContainer'))
const NewsletterPage     = lazy(() => import('@/modules/newsletter/NewsletterPageContainer'))
const MessagesPage       = lazy(() => import('@/modules/messages/MessagesPageContainer'))

// Phase 5: Analytics, Domains, Deployments, CSV, AI Assistant
const AnalyticsPage      = lazy(() => import('@/modules/analytics/AnalyticsPageContainer'))
const DomainsPage        = lazy(() => import('@/modules/domains/DomainsPageContainer'))
const DeploymentsPage    = lazy(() => import('@/modules/deployments/DeploymentsPageContainer'))
const CsvPage            = lazy(() => import('@/modules/csv/CsvPageContainer'))
const AiAssistantPage    = lazy(() => import('@/modules/ai-assistant/AiAssistantPageContainer'))
const SiteContentPage    = lazy(() => import('@/modules/site-content/SiteContentPageContainer'))

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
  // ── Full-screen standalone routes (no DashboardLayout chrome) ──────────────
  {
    path: 'pages/:pageId/preview',
    element: <S><PagePreviewPage /></S>,
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

      // Stories
      { path: 'stories',           element: <S><StoriesPage /></S> },
      { path: 'stories/new',       element: <S><SimpleContentEditorPage /></S> },
      { path: 'stories/:id/edit',  element: <S><SimpleContentEditorPage /></S> },

      // Journal
      { path: 'journal',           element: <S><JournalPage /></S> },
      { path: 'journal/new',       element: <S><SimpleContentEditorPage /></S> },
      { path: 'journal/:id/edit',  element: <S><SimpleContentEditorPage /></S> },

      { path: 'gallery',           element: <S><GalleryPage /></S> },
      { path: 'media',             element: <S><MediaPage /></S> },

      // Destinations
      { path: 'destinations',               element: <S><DestinationsPage /></S> },
      { path: 'destinations/new',           element: <S><SimpleContentEditorPage /></S> },
      { path: 'destinations/:id/edit',      element: <S><SimpleContentEditorPage /></S> },

      { path: 'team',              element: <S><TeamPage /></S> },
      { path: 'settings',               element: <S><SettingsPage /></S> },
      { path: 'settings/localization',  element: <S><LabelsPage /></S> },
      { path: 'categories',        element: <S><CategoriesPage /></S> },
      { path: 'tags',              element: <S><TagsPage /></S> },
      { path: 'themes',            element: <S><ThemesPage /></S> },
      { path: 'site-content',      element: <S><SiteContentPage /></S> },
      // Pages (BlockEditorPage is kept — used here only)
      { path: 'pages',             element: <S><PagesPage /></S> },
      { path: 'pages/new',         element: <S><PagesNewPage /></S> },
      { path: 'pages/:pageId/edit', element: <S><BlockEditorPage /></S> },

      // Products
      { path: 'products',          element: <S><ProductsPage /></S> },
      { path: 'products/new',      element: <S><SimpleContentEditorPage /></S> },
      { path: 'products/:id/edit', element: <S><SimpleContentEditorPage /></S> },

      // Collections
      { path: 'collections',           element: <S><CollectionsPage /></S> },
      { path: 'collections/new',       element: <S><SimpleContentEditorPage /></S> },
      { path: 'collections/:id/edit',  element: <S><SimpleContentEditorPage /></S> },

      { path: 'reviews',           element: <S><ReviewsPage /></S> },
      { path: 'faqs',              element: <S><FaqsPage /></S> },
      { path: 'onboarding',        element: <S><OnboardingPage /></S> },
      { path: 'organizations',     element: <S><OrganizationsPage /></S> },
      { path: 'addons',            element: <S><AddonsPage /></S> },

      // Services
      { path: 'services',          element: <S><ServicesPage /></S> },
      { path: 'services/new',      element: <S><SimpleContentEditorPage /></S> },
      { path: 'services/:id/edit', element: <S><SimpleContentEditorPage /></S> },

      { path: 'testimonials',      element: <S><TestimonialsPage /></S> },
      { path: 'pricing',           element: <S><PricingPage /></S> },
      { path: 'hero',              element: <S><HeroPage /></S> },
      { path: 'comments',          element: <S><CommentsPage /></S> },

      // Commerce + engagement
      { path: 'orders',            element: <S><OrdersPage /></S> },
      { path: 'newsletter',        element: <S><NewsletterPage /></S> },
      { path: 'messages',          element: <S><MessagesPage /></S> },

      // Phase 5: New module pages
      { path: 'analytics',         element: <S><AnalyticsPage /></S> },
      { path: 'domains',           element: <S><DomainsPage /></S> },
      { path: 'deployments',       element: <S><DeploymentsPage /></S> },
      { path: 'csv',               element: <S><CsvPage /></S> },
      { path: 'ai-assistant',      element: <S><AiAssistantPage /></S> },

      // Campaigns + SEO
      { path: 'campaigns',         element: <S><CampaignsPage /></S> },
      { path: 'campaigns/new',     element: <S><SimpleContentEditorPage /></S> },
      { path: 'campaigns/:id/edit', element: <S><SimpleContentEditorPage /></S> },
      { path: 'seo',               element: <S><SeoPage /></S> },

      // 403 — navigated to by handleForbidden() in http/auth.ts
      { path: 'unauthorized',      element: <S><UnauthorizedPage /></S> },

      // 404 catch-all — must be last inside DashboardLayout children
      { path: '*',                 element: <S><NotFoundPage /></S> },
    ],
  },
])
