/**
 * Sanitizes HTML content by removing potentially dangerous tags and attributes
 * while preserving safe content.
 */
export function sanitizeHtml(input: string | undefined): string {
  if (!input) return "";
  
  return input
    // Convert special characters to HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Remove potential script injections
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove potential iframe injections
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove potential event handlers
    .replace(/ on\w+="[^"]*"/g, '')
    // Remove potential javascript: URLs
    .replace(/javascript:[^\s]*/g, '')
    // Remove potential data: URLs
    .replace(/data:[^\s]*/g, '')
    // Trim whitespace
    .trim();
}
