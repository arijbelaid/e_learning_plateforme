'use client';
import { useEffect } from 'react';

export default function ProfileRedirect() {
  useEffect(() => {
    window.location.href = '/dashboard?section=profile';
  }, []);
  return null;
}
