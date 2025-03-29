
import React from "react";
import { FileText } from "lucide-react";

interface MessageSourceReferencesProps {
  messageId: string;
  references: any[];
  showSourceDetails: Record<string, boolean>;
  toggleSourceDetails: (messageId: string) => void;
}

const MessageSourceReferences: React.FC<MessageSourceReferencesProps> = ({
  messageId,
  references,
  showSourceDetails,
  toggleSourceDetails,
}) => {
  if (!references || references.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2 mb-1">
        <button
          onClick={() => toggleSourceDetails(messageId)}
          className="inline-flex items-center text-xs text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-2 py-1 transition-colors"
        >
          <FileText className="h-3 w-3 mr-1" />
          {showSourceDetails[messageId] ? "Hide sources" : `${references.length} sources`}
        </button>
      </div>

      {showSourceDetails[messageId] && (
        <div className="space-y-1 border rounded-md p-2 bg-background mt-1 text-xs text-left">
          <div className="font-medium text-muted-foreground mb-1">Reference documents:</div>
          {references.map((ref, i) => (
            <div
              key={i}
              className="flex items-start gap-1 py-1 border-t border-dashed first:border-0"
            >
              <div className="flex-shrink-0 rounded-full bg-primary/10 w-4 h-4 flex items-center justify-center mt-0.5">
                <span className="text-[10px] font-bold text-primary">{i + 1}</span>
              </div>
              <div>
                <div className="font-medium">{ref.name}</div>
                <div className="text-muted-foreground">
                  Relevance: {Math.round(ref.similarity * 100)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageSourceReferences;
