
import React from "react";

// Procesa formato inline (negritas, cursivas, enlaces)
export const formatInlineText = (text: string): React.ReactNode => {
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

// Función para formatear el texto con markdown básico
export const formatMessageText = (text: string): React.ReactNode => {
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
