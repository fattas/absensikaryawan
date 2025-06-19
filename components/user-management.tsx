"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, UserX } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AdminNotification } from "@/components/admin-notification"
import { deleteUser, resetFaceEnrollment } from "@/lib/user-service"

interface User {
  id: number
  name: string
  email: string
  created_at: string
  has_face_encoding: boolean
}

interface UserManagementProps {
  userData: User[]
}

export function UserManagement({ userData }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResettingFace, setIsResettingFace] = useState(false)
  const [userToResetFace, setUserToResetFace] = useState<User | null>(null)

  const filteredData = userData.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      await deleteUser(userToDelete.id)
      AdminNotification.success(`${userToDelete.name} telah berhasil dihapus`)
      // Remove user from the list
      userData = userData.filter((user) => user.id !== userToDelete.id)
      setUserToDelete(null)
    } catch (error) {
      console.error("Error deleting user:", error)
      AdminNotification.error("Gagal menghapus pengguna")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleResetFaceEnrollment = async () => {
    if (!userToResetFace) return

    setIsResettingFace(true)
    try {
      await resetFaceEnrollment(userToResetFace.id)

      AdminNotification.success(`Data wajah untuk ${userToResetFace.name} telah berhasil direset`)

      // Update the user in the list
      const updatedUserData = userData.map((user) => {
        if (user.id === userToResetFace.id) {
          return { ...user, has_face_encoding: false }
        }
        return user
      })

      // This is a workaround since we can't directly modify userData prop
      // In a real app with proper state management, this would be handled differently
      userData.forEach((user, index) => {
        if (user.id === userToResetFace.id) {
          userData[index].has_face_encoding = false
        }
      })

      setUserToResetFace(null)
    } catch (error) {
      console.error("Error resetting face enrollment:", error)
      AdminNotification.error("Gagal mereset pendaftaran wajah")
    } finally {
      setIsResettingFace(false)
    }
  }

  // Format date as DD-MM-YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Cari berdasarkan nama atau email..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tanggal Pendaftaran</TableHead>
              <TableHead>Wajah Terdaftar</TableHead>
              <TableHead className="text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                  Tidak ada pengguna ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell>
                    {user.has_face_encoding ? (
                      <span className="text-green-600">Ya</span>
                    ) : (
                      <span className="text-red-600">Tidak</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {user.has_face_encoding && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => setUserToResetFace(user)}
                        >
                          Reset Wajah
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setUserToDelete(user)}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pengguna</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          {userToDelete && (
            <div className="py-4">
              <p>
                <strong>Nama:</strong> {userToDelete.name}
              </p>
              <p>
                <strong>Email:</strong> {userToDelete.email}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToDelete(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeleting}>
              {isDeleting ? "Menghapus..." : "Hapus Pengguna"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Face Enrollment Dialog */}
      <Dialog open={!!userToResetFace} onOpenChange={(open) => !open && setUserToResetFace(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Pendaftaran Wajah</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mereset pendaftaran wajah untuk pengguna ini? Pengguna akan dapat mendaftarkan
              wajah mereka lagi jika mereka mau.
            </DialogDescription>
          </DialogHeader>

          {userToResetFace && (
            <div className="py-4">
              <p>
                <strong>Nama:</strong> {userToResetFace.name}
              </p>
              <p>
                <strong>Email:</strong> {userToResetFace.email}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToResetFace(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleResetFaceEnrollment} disabled={isResettingFace}>
              {isResettingFace ? "Mereset..." : "Reset Pendaftaran Wajah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
