import { lazy } from 'react';
import { Route, Switch } from 'wouter';
import { SEOHead, seoConfigs } from '@/components/seo/SEOHead';
import { ProtectedRoute, AdminOnlyRoute } from '@/lib/protected-route';

const CommunityPage = lazy(() => import('@/pages/community'));
const CommunitySearchResults = lazy(() => import('@/pages/community-search-results'));
const PostDetailPage = lazy(() => import('@/pages/post-detail'));
const SavedPosts = lazy(() => import('@/pages/saved-posts'));
const Drafts = lazy(() => import('@/pages/drafts'));
const EditPost = lazy(() => import('@/pages/edit-post'));
const ExplorePage = lazy(() => import('@/pages/explore'));
const MessagesPage = lazy(() => import('@/pages/Messages'));
const NotificationsPage = lazy(() => import('@/pages/notifications'));
const CalendarPage = lazy(() => import('@/pages/calendar'));
const MeetingPage = lazy(() => import('@/pages/meeting'));
const NewMeetingPage = lazy(() => import('@/pages/new-meeting'));
const ERPPage = lazy(() => import('@/pages/erp'));
const EventsPage = lazy(() => import('@/pages/events'));
const EventDetailPage = lazy(() => import('@/pages/event-detail'));
const SocialConsolePage = lazy(() => import('@/pages/social-console'));
const SocialInsightsPage = lazy(() => import('@/pages/social-insights'));
const AICommunityTools = lazy(() => import('@/components/AICommunityTools'));
const PremiumVideoPage = lazy(() => import('@/pages/premium-video'));
const FriendRequestsPage = lazy(() => import('@/pages/friend-requests'));

export function SocialRoutes({ params }: any) {
  return (
    <Switch>
      <ProtectedRoute path="/social-console" component={SocialConsolePage} />
      <ProtectedRoute path="/social-insights" component={SocialInsightsPage} />
      
      <Route path="/community">
        <SEOHead {...seoConfigs.community} />
        <CommunityPage />
      </Route>
      
      <Route path="/community-search">
        <SEOHead title="Community Search - Dedw3n" description="Search across posts, members, videos, events, and dating profiles in the Dedw3n community." />
        <CommunitySearchResults />
      </Route>
      
      <ProtectedRoute path="/community/ai-tools" component={AICommunityTools} />
      <ProtectedRoute path="/saved-posts" component={SavedPosts} />
      <ProtectedRoute path="/drafts" component={Drafts} />
      <ProtectedRoute path="/edit-post/:id" component={EditPost} />
      <ProtectedRoute path="/posts/:id" component={PostDetailPage} />
      <ProtectedRoute path="/explore" component={ExplorePage} />
      <ProtectedRoute path="/messages/:username?" component={MessagesPage} />
      <ProtectedRoute path="/notifications" component={NotificationsPage} />
      <ProtectedRoute path="/friend-requests" component={FriendRequestsPage} />
      <ProtectedRoute path="/erp" component={ERPPage} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/meetings/new" component={NewMeetingPage} />
      <ProtectedRoute path="/meeting/:roomId" component={MeetingPage} />
      <ProtectedRoute path="/events" component={EventsPage} />
      <ProtectedRoute path="/event/:id" component={EventDetailPage} />
      <ProtectedRoute path="/premium-videos" component={PremiumVideoPage} />
      <ProtectedRoute path="/premium-videos/:id" component={PremiumVideoPage} />
    </Switch>
  );
}
