'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AdminGuardProps {
  children: ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifikasi apakah pengguna adalah admin
    const checkAdminStatus = async () => {
      try {
        // Verifikasi token admin dengan API profile
        const response = await fetch('/api/auth/admin/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to verify admin status');
        }

        const data = await response.json();
        if (data && data.role === 'ADMIN') {
          setIsAdmin(true);
        } else {
          router.push('/admin');
        }
      } catch (error) {
        console.error('Error verifying admin status:', error);
        router.push('/admin');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAdmin ? <>{children}</> : null;
};

export default AdminGuard; 