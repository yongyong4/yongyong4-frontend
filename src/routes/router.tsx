import { createBrowserRouter } from 'react-router'

import MobileLayout from '@/components/layout/MobileLayout'
import GuidePage from '@/pages/guide/GuidePage'
import HomePage from '@/pages/home/HomePage'
import NotFoundPage from '@/pages/not-found/NotFoundPage'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'
import PlaceSearchPage from '@/pages/place-search/PlaceSearchPage'
import RoutesPage from '@/pages/routes/RoutesPage'
import StrategyPage from '@/pages/strategy/StrategyPage'
import TripPage from '@/pages/trip/TripPage'
import TripSummaryPage from '@/pages/trip-summary/TripSummaryPage'
import { PATHS } from '@/routes/paths'

export const router = createBrowserRouter([
  {
    element: <MobileLayout />,
    children: [
      { path: PATHS.onboarding, element: <OnboardingPage /> },
      { path: PATHS.home, element: <HomePage /> },
      { path: PATHS.placeSearch, element: <PlaceSearchPage /> },
      { path: PATHS.routes, element: <RoutesPage /> },
      { path: PATHS.strategy, element: <StrategyPage /> },
      { path: PATHS.trip, element: <TripPage /> },
      { path: PATHS.tripSummary, element: <TripSummaryPage /> },
      { path: PATHS.guide, element: <GuidePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
