
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/providers/ToastProvider";
import { AuthProvider } from "./components/providers/AuthProvider";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import "./App.css";

import Index from "./pages/home/Index"; // Update import path
import Dashboard from "./pages/dashboard/Dashboard";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import NotFound from "./pages/NotFound";
import SettingsPage from "./pages/settings/SettingsPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import ChatbotForm from "./pages/chatbots/ChatbotForm";
import ChatbotList from "./pages/chatbots/ChatbotList";
import ChatbotDetail from "./pages/chatbots/ChatbotDetail";
import ChatbotPreview from "./pages/chatbots/ChatbotPreview";
import ChatbotDocuments from "./pages/chatbots/ChatbotDocuments";
import AuthRequired from "./components/auth/AuthRequired";
import WidgetEmbed from "./pages/widget/WidgetEmbed";
import DocumentsPage from "./pages/documents/DocumentsPage";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/signup" element={<SignUp />} />
            <Route path="/widget/:chatbotId" element={<WidgetEmbed />} />

            {/* Protected routes */}
            <Route element={<AuthRequired />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chatbots" element={<ChatbotList />} />
              <Route path="/chatbots/new" element={<ChatbotForm />} />
              <Route path="/chatbots/:chatbotId" element={<ChatbotDetail />} />
              <Route path="/chatbots/:chatbotId/edit" element={<ChatbotForm />} />
              <Route path="/chatbots/:chatbotId/preview" element={<ChatbotPreview />} />
              <Route path="/chatbots/:chatbotId/documents" element={<ChatbotDocuments />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallbacks */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
