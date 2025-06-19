import { Card, CardContent } from "@/components/ui/card"

interface UserGreetingProps {
  user: {
    name: string
  } | null
}

export function UserGreeting({ user }: UserGreetingProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Selamat pagi"
    if (hour < 18) return "Selamat siang"
    return "Selamat malam"
  }

  const firstName = user?.name?.split(" ")[0] || "Pengguna"

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-md">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold">{getGreeting()},</h2>
        <p className="text-2xl font-bold">{firstName}</p>
        <p className="text-sm mt-2 opacity-90">Selamat datang di portal absensi Anda</p>
      </CardContent>
    </Card>
  )
}
