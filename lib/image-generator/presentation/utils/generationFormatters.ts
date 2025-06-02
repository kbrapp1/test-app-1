export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return 'text-green-600';
    case 'processing': return 'text-blue-600';
    case 'failed': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'completed': return 'succeeded';
    case 'processing': return 'processing';
    case 'failed': return 'failed';
    default: return status;
  }
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const truncatePrompt = (prompt: string, maxLength: number = 80): string => {
  return prompt.length > maxLength ? prompt.substring(0, maxLength) + '...' : prompt;
}; 