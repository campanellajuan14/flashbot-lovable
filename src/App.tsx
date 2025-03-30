
import { Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/dashboard/Dashboard";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import DocumentsPage from "./pages/documents/DocumentsPage";
import ChatbotList from "./pages/chatbots/ChatbotList";
import ChatbotForm from "./pages/chatbots/ChatbotForm";
import ChatbotDetail from "./pages/chatbots/ChatbotDetail";
import ChatbotDocuments from "./pages/chatbots/ChatbotDocuments";
import ChatbotPreview from "./pages/chatbots/ChatbotPreview";
import WidgetEmbed from "./pages/widget/WidgetEmbed";
import AuthRequired from "./components/auth/AuthRequired";
import { Toaster } from "./components/ui/toaster";
import "./App.css";
import SettingsPage from "./pages/settings/SettingsPage";
import ConversationsPage from "./pages/conversations/ConversationsPage";
import ConversationDetailPage from "./pages/conversations/ConversationDetailPage";

const WidgetRoute = () => (
  <Routes>
    <Route path="/widget/:widgetId" element={<WidgetEmbed />} />
  </Routes>
);

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth/signin" element={<SignIn />} />
    <Route path="/auth/signup" element={<SignUp />} />
    <Route path="/widget/:widgetId" element={<WidgetEmbed />} />
    
    <Route element={<AuthRequired />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/documents" element={<DocumentsPage />} />
      
      <Route path="/chatbots" element={<ChatbotList />} />
      <Route path="/chatbots/new" element={<ChatbotForm />} />
      <Route path="/chatbots/:id" element={<ChatbotDetail />} />
      <Route path="/chatbots/:id/edit" element={<ChatbotForm />} />
      <Route path="/chatbots/:id/documents" element={<ChatbotDocuments />} />
      <Route path="/chatbots/:id/preview" element={<ChatbotPreview />} />
      
      <Route path="/conversations" element={<ConversationsPage />} />
      <Route path="/conversations/:id" element={<ConversationDetailPage />} />
      
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

function App() {
  const isWidgetRoute = window.location.pathname.startsWith('/widget/');
  
  return (
    <>
      {isWidgetRoute ? <WidgetRoute /> : <AppRoutes />}
      <Toaster />
    </>
  );
}

export default App;
