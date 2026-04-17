export default function DashboardLoading() {
  return (
    <div className="fade-in">
      {/* Page header skeleton */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-7 w-36 rounded-lg" />
          <div className="skeleton h-4 w-56 rounded-md" />
        </div>
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>

      <div className="flex flex-col gap-6">
        {/* ── Row 1: Stat cards ───────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-5 flex flex-col gap-3"
              style={{ background: '#111827', border: '1px solid #1e2a3a' }}
            >
              <div className="skeleton h-3.5 w-24 rounded-md" />
              <div className="flex items-end justify-between gap-2">
                <div className="flex flex-col gap-2">
                  <div className="skeleton h-7 w-28 rounded-lg" />
                  <div className="skeleton h-5 w-16 rounded-md" />
                </div>
                <div className="skeleton h-12 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* ── Row 2: Net Worth Chart + Allocation Pie ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chart card — 2/3 */}
          <div
            className="lg:col-span-2 rounded-xl"
            style={{ background: '#111827', border: '1px solid #1e2a3a' }}
          >
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#1e2a3a' }}>
              <div className="skeleton h-4 w-44 rounded-md" />
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton h-7 w-9 rounded-md" />
                ))}
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="skeleton h-[320px] w-full rounded-xl" />
            </div>
          </div>

          {/* Pie card — 1/3 */}
          <div
            className="rounded-xl"
            style={{ background: '#111827', border: '1px solid #1e2a3a' }}
          >
            <div className="px-6 py-4 border-b" style={{ borderColor: '#1e2a3a' }}>
              <div className="skeleton h-4 w-36 rounded-md" />
            </div>
            <div className="px-6 py-4 flex items-center gap-4">
              {/* Donut placeholder */}
              <div
                className="skeleton shrink-0 rounded-full"
                style={{ width: '160px', height: '160px' }}
              />
              {/* Legend lines */}
              <div className="flex-1 flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="skeleton w-2.5 h-2.5 rounded-full shrink-0" />
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="skeleton h-3 rounded-md" style={{ width: `${60 + i * 10}%` }} />
                      <div className="skeleton h-2.5 w-12 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 3: Cash Flow + Quick Stats ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Cash flow */}
          <div
            className="rounded-xl"
            style={{ background: '#111827', border: '1px solid #1e2a3a' }}
          >
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#1e2a3a' }}>
              <div className="skeleton h-4 w-28 rounded-md" />
              <div className="flex gap-3">
                <div className="skeleton h-3.5 w-20 rounded-md" />
                <div className="skeleton h-3.5 w-20 rounded-md" />
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="skeleton h-[280px] w-full rounded-xl" />
            </div>
          </div>

          {/* Quick stats */}
          <div
            className="rounded-xl"
            style={{ background: '#111827', border: '1px solid #1e2a3a' }}
          >
            <div className="px-6 py-4 border-b" style={{ borderColor: '#1e2a3a' }}>
              <div className="skeleton h-4 w-36 rounded-md" />
            </div>
            <div className="px-6 py-4 flex flex-col gap-5">
              {/* Progress bars */}
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="skeleton h-3.5 w-36 rounded-md" />
                    <div className="skeleton h-3.5 w-16 rounded-md" />
                  </div>
                  <div className="skeleton h-2 w-full rounded-full" />
                  <div className="skeleton h-3 w-20 rounded-md" />
                </div>
              ))}
              <div className="h-px" style={{ background: '#1e2a3a' }} />
              {/* Stat rows */}
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton w-8 h-8 rounded-lg shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="skeleton h-3 w-24 rounded-md" />
                    <div className="skeleton h-3.5 w-40 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 4: Quick Actions ────────────────────────────────── */}
        <div>
          <div className="skeleton h-3.5 w-28 rounded-md mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl border"
                style={{ background: '#111827', borderColor: '#1e2a3a' }}
              >
                <div className="skeleton w-10 h-10 rounded-lg shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="skeleton h-3.5 w-28 rounded-md" />
                  <div className="skeleton h-3 w-36 rounded-md" />
                </div>
                <div className="skeleton w-4 h-4 rounded-md shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
