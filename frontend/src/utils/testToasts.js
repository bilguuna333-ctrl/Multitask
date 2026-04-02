// Test component to verify toast close functionality
// This can be used to test different toast types

import toast from 'react-hot-toast';

export const testToasts = {
  success: () => toast.success('Company created!'),
  error: () => toast.error('Something went wrong!'),
  loading: () => toast.loading('Loading...'),
  custom: () => toast('Custom message', { duration: 5000 }),
};

// You can call these from browser console:
// testToasts.success()
// testToasts.error()
// testToasts.loading()
