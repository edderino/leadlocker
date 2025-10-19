'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function SendSummaryButton() {
  const [isSending, setIsSending] = useState(false);

  const handleSendSummary = async () => {
    setIsSending(true);

    try {
      const response = await fetch('/api/summary/send', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send summary');
      }

      toast.success('Daily summary SMS sent!');
    } catch (error) {
      console.error('Error sending summary:', error);
      toast.error('Failed to send summary SMS');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <button
      onClick={handleSendSummary}
      disabled={isSending}
      className={`px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors ${
        isSending
          ? 'bg-gray-400 text-white cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
      }`}
    >
      {isSending ? 'Sending...' : 'Send Daily Summary SMS'}
    </button>
  );
}

