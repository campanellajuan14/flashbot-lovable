
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./types";

interface ChatMessageItemProps {
  message: ChatMessage;
  showSourceDetails: Record<string, boolean>;
  toggleSourceDetails: (messageId: string) => void;
}

// Función para formatear el texto con markdown básico
const formatMessageText = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // Dividir por saltos de línea para procesarlos correctamente
  const paragraphs = text.split('\n\n');
  
  return (
    <>
      {paragraphs.map((paragraph, i) => {
        // Saltar párrafos vacíos
        if (!paragraph.trim()) return <br key={i} />;
        
        // Formatear listas
        if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('* ')) {
          const items = paragraph.split(/\n[*-] /);
          return (
            <ul key={i} className="list-disc pl-5 my-2">
              {items.filter(Boolean).map((item, j) => (
                <li key={j}>{formatInlineText(item.replace(/^[*-] /, ''))}</li>
              ))}
            </ul>
          );
        }
        
        // Formatear listas numeradas
        if (paragraph.trim().match(/^\d+\.\s/)) {
          // Buscar todos los elementos que empiezan por número + punto
          const listItems = paragraph.split('\n')
            .filter(line => line.trim().match(/^\d+\.\s/));
          
          return (
            <ol key={i} className="list-decimal pl-5 my-2">
              {listItems.map((item, j) => (
                <li key={j}>{formatInlineText(item.replace(/^\d+\.\s/, ''))}</li>
              ))}
            </ol>
          );
        }
        
        // Procesar títulos
        if (paragraph.startsWith('# ')) {
          return <h2 key={i} className="text-lg font-bold my-2">{formatInlineText(paragraph.substring(2))}</h2>;
        }
        if (paragraph.startsWith('## ')) {
          return <h3 key={i} className="text-md font-bold my-2">{formatInlineText(paragraph.substring(3))}</h3>;
        }
        
        // Párrafo normal con posible formato inline
        return <p key={i} className="my-2">{formatInlineText(paragraph)}</p>;
      })}
    </>
  );
};

// Procesa formato inline (negritas, cursivas, enlaces)
const formatInlineText = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // Primero dividimos el texto en segmentos por los diferentes formatos
  const segments: React.ReactNode[] = [];
  let currentText = text;
  let lastIndex = 0;
  
  // Procesar negritas con **texto** o __texto__
  const boldRegex = /(\*\*|__)(.*?)\1/g;
  let boldMatch;
  while ((boldMatch = boldRegex.exec(currentText)) !== null) {
    if (boldMatch.index > lastIndex) {
      segments.push(currentText.substring(lastIndex, boldMatch.index));
    }
    segments.push(<strong key={`bold-${segments.length}`}>{boldMatch[2]}</strong>);
    lastIndex = boldMatch.index + boldMatch[0].length;
  }
  
  // Añadir el texto restante
  if (lastIndex < currentText.length) {
    segments.push(currentText.substring(lastIndex));
  }
  
  // Si no encontramos segmentos, devolvemos el texto original
  if (segments.length === 0) {
    return text;
  }
  
  // Procesar cursivas y enlaces en los segmentos de texto plano
  return segments.map((segment, i) => {
    if (typeof segment !== 'string') return segment;
    
    // Procesar cursivas
    const italicSegments: React.ReactNode[] = [];
    const italicRegex = /(\*|_)(.*?)\1/g;
    let italicMatch;
    let itLastIndex = 0;
    
    while ((italicMatch = italicRegex.exec(segment)) !== null) {
      if (italicMatch.index > itLastIndex) {
        italicSegments.push(segment.substring(itLastIndex, italicMatch.index));
      }
      italicSegments.push(<em key={`it-${italicSegments.length}`}>{italicMatch[2]}</em>);
      itLastIndex = italicMatch.index + italicMatch[0].length;
    }
    
    if (itLastIndex < segment.length) {
      italicSegments.push(segment.substring(itLastIndex));
    }
    
    // Procesar links
    return italicSegments.length > 0 
      ? italicSegments.map((itSegment, j) => {
          if (typeof itSegment !== 'string') return itSegment;
          
          // Formatear links [texto](url)
          return itSegment.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
            (_, text, url) => `<a href="${url}" target="_blank" class="text-primary underline">${text}</a>`);
        })
      : segment;
  });
};

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  showSourceDetails,
  toggleSourceDetails,
}) => {
  return (
    <div
      className={cn(
        "flex w-full",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex items-start gap-3 max-w-[80%]",
        message.role === "user" ? "flex-row-reverse" : "flex-row"
      )}>
        <Avatar className={message.role === "user" ? "bg-primary" : "bg-accent border"}>
          {message.role === "user" ? (
            <>
              <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
              <AvatarImage src="" />
            </>
          ) : (
            <>
              <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
              <AvatarImage src="" />
            </>
          )}
        </Avatar>
        <div className="max-w-full">
          <div
            className={cn(
              "rounded-lg px-4 py-3 text-left",
              message.role === "user"
                ? "bg-primary text-primary-foreground chat-bubble-user"
                : "bg-accent text-accent-foreground chat-bubble-bot"
            )}
          >
            {message.role === "user" 
              ? message.content 
              : formatMessageText(message.content)}
          </div>
          {message.references && message.references.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-2 mb-1">
                <button
                  onClick={() => toggleSourceDetails(message.id)}
                  className="inline-flex items-center text-xs text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-2 py-1 transition-colors"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  {showSourceDetails[message.id] ? "Hide sources" : `${message.references.length} sources`}
                </button>
              </div>

              {showSourceDetails[message.id] && (
                <div className="space-y-1 border rounded-md p-2 bg-background mt-1 text-xs text-left">
                  <div className="font-medium text-muted-foreground mb-1">Reference documents:</div>
                  {message.references.map((ref, i) => (
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
          )}
          <div className="mt-1 text-xs text-muted-foreground pl-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageItem;
