
// Formatting utilities for the chat widget

/**
 * Format message content with formatting, links, and line breaks
 * @param {string} content - The message content to format
 * @param {object} colors - The color configuration
 * @returns {string} Formatted HTML content
 */
export function formatMessageContent(content, colors) {
  // First handle bold text with **text** format
  let formattedContent = content.replace(
    /\*\*(.*?)\*\*/g, 
    '<strong>$1</strong>'
  );
  
  // Convert URLs to links
  formattedContent = formattedContent.replace(
    /(https?:\/\/[^\s]+)/g, 
    `<a href="$1" target="_blank" style="color: ${colors.links || '#0078ff'};">$1</a>`
  );
  
  // Convert line breaks to <br>
  return formattedContent.replace(/\n/g, '<br>');
}
