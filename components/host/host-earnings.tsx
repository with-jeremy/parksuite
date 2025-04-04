"use client"

import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, Calendar, CreditCard, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type EarningsSummary = {
  total: number
  pending: number
  completed: number
  bookings: number
}

type RecentPayment = {
  id: string
  amount: number
  status: string
  created_at: string
  booking: {
    parking_spot: {
      title: string
    }
  }
}

export function HostEarnings() {
  const [timeframe, setTimeframe] = useState<string>("month")
  const [earnings, setEarnings] = useState<EarningsSummary>({
    total: 0,
    pending: 0,
    completed: 0,
    bookings: 0,
  })
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEarnings() {
      try {
        setLoading(true)
        setError(null)

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) throw new Error("Authentication error")
        if (!user) throw new Error("Not authenticated")

        // Get date range based on timeframe
        const today = new Date()
        let startDate: Date

        if (timeframe === "week") {
          startDate = new Date(today)
          startDate.setDate(today.getDate() - 7)
        } else if (timeframe === "month") {
          startDate = new Date(today)
          startDate.setMonth(today.getMonth() - 1)
        } else {
          startDate = new Date(today)
          startDate.setFullYear(today.getFullYear() - 1)
        }

        // Format dates for query
        const startDateStr = startDate.toISOString().split("T")[0]
        const endDateStr = today.toISOString().split("T")[0]

        // Get user's parking spots
        const { data: spots, error: spotsError } = await supabase
          .from("parking_spots")
          .select("id")
          .eq("owner_id", user.id)

        if (spotsError) throw new Error("Error fetching parking spots")

        if (!spots || spots.length === 0) {
          setEarnings({
            total: 0,
            pending: 0,
            completed: 0,
            bookings: 0,
          })
          setRecentPayments([])
          setLoading(false)
          return
        }

        const spotIds = spots.map((spot) => spot.id)

        // Get bookings for these spots in the date range
        const { data: bookings, error: bookingsError } = await supabase
          .from("bookings")
          .select(`
            id, total_price, service_fee, status, created_at, parking_spot_id,
            parking_spots:parking_spot_id(title)
          `)
          .in("parking_spot_id", spotIds)
          .gte("booking_date", startDateStr)
          .lte("booking_date", endDateStr)
          .order("created_at", { ascending: false })

        if (bookingsError) throw new Error("Error fetching bookings")

        if (!bookings || bookings.length === 0) {
          setEarnings({
            total: 0,
            pending: 0,
            completed: 0,
            bookings: 0,
          })
          setRecentPayments([])
          setLoading(false)
          return
        }

        // Calculate earnings
        const total = bookings.reduce((sum, booking) => sum + (booking.total_price - booking.service_fee), 0)
        const pending = bookings
          .filter((b) => b.status === "pending" || b.status === "confirmed")
          .reduce((sum, booking) => sum + (booking.total_price - booking.service_fee), 0)
        const completed = bookings
          .filter((b) => b.status === "completed")
          .reduce((sum, booking) => sum + (booking.total_price - booking.service_fee), 0)

        setEarnings({
          total,
          pending,
          completed,
          bookings: bookings.length,
        })

        // Set recent payments (completed bookings)
        const recentPayments = bookings
          .filter((b) => b.status === "completed")
          .slice(0, 5)
          .map((booking) => ({
            id: booking.id,
            amount: booking.total_price - booking.service_fee,
            status: "completed",
            created_at: booking.created_at,
            booking: {
              parking_spot: {
                title: booking.parking_spots.title,
              },
            },
          }))

        setRecentPayments(recentPayments)
      } catch (err: any) {
        console.error("Error fetching earnings:", err)
        setError(err.message || "Failed to load earnings data")
      } finally {
        setLoading(false)
      }
    }

    fetchEarnings()
  }, [timeframe])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="month" value={timeframe} onValueChange={setTimeframe} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="year">Year</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earnings.total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">For this {timeframe}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earnings.pending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earnings.completed.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Processed payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnings.bookings}</div>
            <p className="text-xs text-muted-foreground">Total reservations</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Your most recent earnings from bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading payment data...</div>
          ) : recentPayments.length > 0 ? (
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{payment.booking.parking_spot.title}</p>
                    <p className="text-sm text-muted-foreground">{new Date(payment.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={payment.status === "completed" ? "text-green-600" : "text-amber-600"}>
                      ${payment.amount.toFixed(2)}
                    </span>
                    <Badge variant={payment.status === "completed" ? "default" : "outline"}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No recent payments to display</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

