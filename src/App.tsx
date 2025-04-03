
import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Authenticated routes guard
import AuthRequired from './components/auth/AuthRequired';

// Static imports for initial load (avoid lazy loading for these)
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import Dashboard from './pages/dashboard/Dashboard';

// Lazy loaded components to improve initial load performance
const ChatbotForm = lazy(() => import('./pages/chatbots/ChatbotForm'));
const ChatbotList = lazy(() => import('./pages/chatbots/ChatbotList'));
const ChatbotDetail = lazy(() => import('./pages/chatbots/ChatbotDetail'));
const ChatbotDocuments = lazy(() => import('./pages/chatbots/ChatbotDocuments'));
const ShareSettings = lazy(() => import('./components/chatbots/ShareSettings').then(module => ({ default: module.default })));
const ChatbotPreview = lazy(() => import('./pages/chatbots/ChatbotPreview'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const WhatsAppSettingsPage = lazy(() => import('./pages/settings/WhatsAppSettingsPage'));
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage'));
const ConversationsPage = lazy(() => import('./pages/conversations/ConversationsPage'));
const ConversationDetailPage = lazy(() => import('./pages/conversations/ConversationDetailPage'));
const DocumentsPage = lazy(() => import('./pages/documents/DocumentsPage'));
const WidgetEmbed = lazy(() => import('./pages/widget/WidgetEmbed'));

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Suspense fallback={
          <div className="w-full h-screen flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        }>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/widget/:id" element={<WidgetEmbed />} />

            {/* Protected routes */}
            <Route element={<AuthRequired />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chatbots" element={<ChatbotList />} />
              <Route path="/chatbots/new" element={<ChatbotForm />} />
              <Route path="/chatbots/:id" element={<ChatbotDetail />} />
              <Route path="/chatbots/:id/edit" element={<ChatbotForm />} />
              <Route path="/chatbots/:id/documents" element={<ChatbotDocuments />} />
              <Route path="/chatbots/:id/share" element={<ShareSettings />} />
              <Route path="/chatbots/:id/preview" element={<ChatbotPreview />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/whatsapp" element={<WhatsAppSettingsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/conversations" element={<ConversationsPage />} />
              <Route path="/conversations/:id" element={<ConversationDetailPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
            </Route>

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
