'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AdminNotification } from '@/components/admin-notification';
import AdminGuard from '@/components/AdminGuard';

export default function TimeSettingsPage() {
  const [maxClockInTime, setMaxClockInTime] = useState('07:00');
  const [minClockOutTime, setMinClockOutTime] = useState('17:00');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch current time settings
  useEffect(() => {
    async function fetchTimeSettings() {
      try {
        setLoading(true);
        const response = await fetch('/api/time-settings');
        
        if (!response.ok) {
          throw new Error('Gagal mengambil data pengaturan waktu');
        }
        
        const data = await response.json();
        setMaxClockInTime(data.maxClockInTime);
        setMinClockOutTime(data.minClockOutTime);
      } catch (error) {
        console.error('Error fetching time settings:', error);
        AdminNotification.error('Gagal mengambil data pengaturan waktu');
      } finally {
        setLoading(false);
      }
    }

    fetchTimeSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Validate time format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(maxClockInTime) || !timeRegex.test(minClockOutTime)) {
        AdminNotification.error('Format waktu tidak valid. Gunakan format HH:MM (24-jam)');
        return;
      }
      
      const response = await fetch('/api/time-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxClockInTime,
          minClockOutTime,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan pengaturan waktu');
      }
      
      AdminNotification.success('Pengaturan berhasil disimpan');
    } catch (error: any) {
      console.error('Error updating time settings:', error);
      AdminNotification.error(error.message || 'Gagal menyimpan pengaturan waktu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminGuard>
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">Pengaturan Waktu Absensi</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Konfigurasi Waktu Absensi</CardTitle>
            <CardDescription>
              Atur batasan waktu untuk absensi masuk dan pulang karyawan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxClockInTime">
                      Batas Waktu Masuk
                    </Label>
                    <Input 
                      id="maxClockInTime"
                      type="time"
                      value={maxClockInTime}
                      onChange={(e) => setMaxClockInTime(e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Karyawan yang masuk setelah waktu ini akan dianggap terlambat
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="minClockOutTime">
                      Waktu Minimum Pulang
                    </Label>
                    <Input 
                      id="minClockOutTime"
                      type="time"
                      value={minClockOutTime}
                      onChange={(e) => setMinClockOutTime(e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Karyawan tidak dapat pulang sebelum waktu ini
                    </p>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full md:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Pengaturan'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
} 