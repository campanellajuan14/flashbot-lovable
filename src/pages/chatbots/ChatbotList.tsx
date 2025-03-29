
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useChatbotsList } from "./hooks/useChatbotsList";
import ChatbotListHeader from "./components/ChatbotListHeader";
import ChatbotSearch from "./components/ChatbotSearch";
import ChatbotGridView from "./components/ChatbotGridView";
import EmptyChatbotState from "./components/EmptyChatbotState";
import LoadingState from "./components/LoadingState";

const ChatbotList = () => {
  const {
    searchQuery,
    setSearchQuery,
    filteredChatbots,
    isLoading,
    isLoadingDocuments,
    isError,
    refetch,
    copyToClipboard,
    handleDelete,
    user
  } = useChatbotsList();

  useEffect(() => {
    console.log("Current user:", user);
    console.log("Is loading:", isLoading);
    console.log("Filtered chatbots:", filteredChatbots);
  }, [user, isLoading, filteredChatbots]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <ChatbotListHeader />
        
        <ChatbotSearch 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {isLoading || isLoadingDocuments ? (
          <LoadingState />
        ) : isError ? (
          <div className="text-center py-8">
            <div className="text-destructive mb-2">Error loading chatbots</div>
            <Button onClick={() => refetch()}>Try again</Button>
          </div>
        ) : (
          <>
            {filteredChatbots.length > 0 ? (
              <ChatbotGridView 
                chatbots={filteredChatbots} 
                onCopyId={copyToClipboard} 
                onDelete={handleDelete} 
              />
            ) : (
              <EmptyChatbotState searchQuery={searchQuery} />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChatbotList;
