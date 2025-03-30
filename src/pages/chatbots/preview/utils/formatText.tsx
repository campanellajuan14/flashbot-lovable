
import React from "react";

// Process inline formatting (bold, italics, links)
export const formatInlineText = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // First divide the text into segments by the different formats
  const segments: React.ReactNode[] = [];
  let currentText = text;
  let lastIndex = 0;
  
  // Process bold with **text** or __text__
  const boldRegex = /(\*\*|__)(.*?)\1/g;
  let boldMatch;
  while ((boldMatch = boldRegex.exec(currentText)) !== null) {
    if (boldMatch.index > lastIndex) {
      segments.push(currentText.substring(lastIndex, boldMatch.index));
    }
    segments.push(<strong key={`bold-${segments.length}`}>{boldMatch[2]}</strong>);
    lastIndex = boldMatch.index + boldMatch[0].length;
  }
  
  // Add remaining text
  if (lastIndex < currentText.length) {
    segments.push(currentText.substring(lastIndex));
  }
  
  // If no segments found, return original text
  if (segments.length === 0) {
    return text;
  }
  
  // Process italics and links in plain text segments
  return segments.map((segment, i) => {
    if (typeof segment !== 'string') return segment;
    
    // Process italics
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
    
    // Process links
    return italicSegments.length > 0 
      ? italicSegments.map((itSegment, j) => {
          if (typeof itSegment !== 'string') return itSegment;
          
          // Format links [text](url)
          return itSegment.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
            (_, text, url) => `<a href="${url}" target="_blank" class="text-primary underline">${text}</a>`);
        })
      : segment;
  });
};

// Function to format text with basic markdown
export const formatMessageText = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // Split by line breaks to process them correctly
  const paragraphs = text.split('\n\n');
  
  return (
    <>
      {paragraphs.map((paragraph, i) => {
        // Skip empty paragraphs
        if (!paragraph.trim()) return <br key={i} />;
        
        // Format lists
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
        
        // Format numbered lists
        if (paragraph.trim().match(/^\d+\.\s/)) {
          // Split paragraph into lines
          const lines = paragraph.split('\n');
          
          // Filter lines starting with a number followed by a period
          const numberedItems = lines.filter(line => line.trim().match(/^\d+\.\s/));
          
          return (
            <ol key={i} className="list-decimal pl-5 my-2">
              {numberedItems.map((item, j) => {
                // Extract the number from the item to maintain correct numbering
                const numberMatch = item.match(/^(\d+)\.\s/);
                const itemText = item.replace(/^\d+\.\s/, '');
                
                return (
                  <li key={j} value={numberMatch ? parseInt(numberMatch[1]) : j + 1}>
                    {formatInlineText(itemText)}
                  </li>
                );
              })}
            </ol>
          );
        }
        
        // Process headers
        if (paragraph.startsWith('# ')) {
          return <h2 key={i} className="text-lg font-bold my-2">{formatInlineText(paragraph.substring(2))}</h2>;
        }
        if (paragraph.startsWith('## ')) {
          return <h3 key={i} className="text-md font-bold my-2">{formatInlineText(paragraph.substring(3))}</h3>;
        }
        
        // Normal paragraph with possible inline formatting
        return <p key={i} className="my-2">{formatInlineText(paragraph)}</p>;
      })}
    </>
  );
};
