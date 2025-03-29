
// Formatting utilities for the chat widget

/**
 * Format message content with links and line breaks
 * @param {string} content - The message content to format
 * @param {object} colors - The color configuration
 * @returns {string} Formatted HTML content
 */
export function formatMessageContent(content, colors) {
  // Convert URLs to links
  const linkedText = content.replace(
    /(https?:\/\/[^\s]+)/g, 
    `<a href="$1" target="_blank" style="color: ${colors.links || '#0078ff'};">$1</a>`
  );
  
  // Convert line breaks to <br>
  return linkedText.replace(/\n/g, '<br>');
}
