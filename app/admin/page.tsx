"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

type Profile = {
  id: string
  name: string | null
  email: string | null
  role: string
  created_at: string | null
}

type Stats = {
  totalUsers: number
  premiumUsers: number
  totalEvents: number
  totalReviews: number
  monthlyRevenue: number
}

type ChartPoint = { date: string; revenue: number; users: number }

function StatCard({
  title, value, icon, color, format,
}: {
  title: string; value: number; icon: string; color: string; format?: "number" | "currency"
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {format === "currency" ? value.toLocaleString() + "원" : value.toLocaleString()}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

const PERIODS = [
  { label: "30일", days: 30 },
  { label: "3개월", days: 90 },
  { label: "12개월", days: 365 },
]

function buildChartData(
  payments: { amount: number; created_at: string }[],
  profiles: { created_at: string }[],
  days: number
): ChartPoint[] {
  const now = new Date()
  // 30일: 일별 / 90일: 주별 / 365일: 월별
  const groupBy = days <= 30 ? "day" : days <= 90 ? "week" : "month"

  const getKey = (date: Date) => {
    if (groupBy === "day") {
      return date.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })
    } else if (groupBy === "week") {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      return weekStart.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })
    } else {
      return date.toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit" }).replace(". ", "/").replace(".", "")
    }
  }

  // 기간 내 전체 구간 키 목록 생성
  const keys: string[] = []
  const keySet = new Set<string>()
  const step = groupBy === "month" ? 30 : groupBy === "week" ? 7 : 1
  for (let i = days; i >= 0; i -= step) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const k = getKey(d)
    if (!keySet.has(k)) { keySet.add(k); keys.push(k) }
  }

  const revenueMap: Record<string, number> = {}
  const usersMap: Record<string, number> = {}
  keys.forEach((k) => { revenueMap[k] = 0; usersMap[k] = 0 })

  const cutoff = new Date(now)
  cutoff.setDate(now.getDate() - days)

  payments.forEach(({ amount, created_at }) => {
    const d = new Date(created_at)
    if (d < cutoff) return
    const k = getKey(d)
    if (k in revenueMap) revenueMap[k] += amount
  })

  profiles.forEach(({ created_at }) => {
    const d = new Date(created_at)
    if (d < cutoff) return
    const k = getKey(d)
    if (k in usersMap) usersMap[k] += 1
  })

  return keys.map((k) => ({ date: k, revenue: revenueMap[k], users: usersMap[k] }))
}

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.dataKey === "revenue" ? p.value.toLocaleString() + "원" : p.value + "명"}
        </p>
      ))}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, premiumUsers: 0, totalEvents: 0, totalReviews: 0, monthlyRevenue: 0,
  })
  const [recentUsers, setRecentUsers] = useState<Profile[]>([])
  const [allPayments, setAllPayments] = useState<{ amount: number; created_at: string }[]>([])
  const [allProfiles, setAllProfiles] = useState<{ created_at: string }[]>([])
  const [period, setPeriod] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDashboardData() }, [])

  async function fetchDashboardData() {
    const supabase = createClient()
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const yearAgo = new Date(now); yearAgo.setFullYear(now.getFullYear() - 1)

    const [
      { count: totalUsers },
      { count: premiumUsers },
      { count: totalEvents },
      { count: totalReviews },
      { data: recentUsersData },
      { data: revenueData },
      { data: paymentsHistory },
      { data: profilesHistory },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).in("role", ["premium", "admin"]),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("reviews").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("id, name, email, role, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("payments").select("amount").eq("status", "completed").gte("created_at", firstDay),
      supabase.from("payments").select("amount, created_at").eq("status", "completed").gte("created_at", yearAgo.toISOString()),
      supabase.from("profiles").select("created_at").gte("created_at", yearAgo.toISOString()),
    ])

    const monthlyRevenue = (revenueData ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0)

    setStats({
      totalUsers: totalUsers ?? 0,
      premiumUsers: premiumUsers ?? 0,
      totalEvents: totalEvents ?? 0,
      totalReviews: totalReviews ?? 0,
      monthlyRevenue,
    })
    setRecentUsers(recentUsersData ?? [])
    setAllPayments((paymentsHistory ?? []).filter((p) => p.created_at != null) as { amount: number; created_at: string }[])
    setAllProfiles((profilesHistory ?? []).filter((p) => p.created_at != null) as { created_at: string }[])
    setLoading(false)
  }

  const chartData = buildChartData(allPayments, allProfiles, period)
  const totalRevenue = allPayments.reduce((s, p) => s + p.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">피플앤아트 관리자 현황</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <StatCard title="전체 회원수" value={stats.totalUsers} icon="👥" color="bg-blue-50" />
        <StatCard title="프리미엄 회원수" value={stats.premiumUsers} icon="⭐" color="bg-orange-50" />
        <StatCard title="이벤트수" value={stats.totalEvents} icon="🎭" color="bg-green-50" />
        <StatCard title="후기수" value={stats.totalReviews} icon="📝" color="bg-purple-50" />
        <StatCard title="이번 달 매출" value={stats.monthlyRevenue} icon="💰" color="bg-green-50" format="currency" />
      </div>

      {/* 매출 / 가입자 추이 그래프 */}
      <div className="bg-white rounded-xl border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">매출 및 가입 추이</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              누적 매출 {totalRevenue.toLocaleString()}원
            </p>
          </div>
          <div className="flex gap-1">
            {PERIODS.map(({ label, days }) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  period === days
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* 매출 차트 */}
          <p className="text-xs font-medium text-gray-500 mb-3">매출 (원)</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 10000 ? `${(v / 10000).toFixed(0)}만` : v.toString()} width={45} />
              <Tooltip content={<RevenueTooltip />} />
              <Area type="monotone" dataKey="revenue" name="매출" stroke="#f97316" strokeWidth={2} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>

          {/* 신규 가입 차트 */}
          <p className="text-xs font-medium text-gray-500 mt-6 mb-3">신규 가입 (명)</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
              <Tooltip content={<RevenueTooltip />} />
              <Bar dataKey="users" name="신규 가입" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 최근 가입 회원 */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">최근 가입 회원</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">역할</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-sm text-gray-900">{user.name ?? "-"}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{user.email ?? "-"}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      user.role === "admin" ? "bg-orange-100 text-orange-700"
                        : user.role === "premium" ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString("ko-KR") : "-"}
                  </td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">가입 회원이 없습니다</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
