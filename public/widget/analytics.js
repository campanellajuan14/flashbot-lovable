
// Analytics tracking
export function trackEvent(action, label, value) {
  // Google Analytics 4
  if (window.gtag && typeof window.gtag === 'function') {
    window.gtag('event', action, {
      'event_category': 'Chatbot',
      'event_label': label,
      'value': value
    });
  }
  
  // Google Analytics Universal
  if (window.ga && typeof window.ga === 'function') {
    window.ga('send', 'event', 'Chatbot', action, label, value);
  }
}
