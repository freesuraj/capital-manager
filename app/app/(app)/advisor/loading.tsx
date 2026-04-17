export default function AdvisorLoading() {
  return (
    <div
      className="-m-6 flex"
      style={{ height: '100vh', maxWidth: 'none' }}
      aria-label="Loading AI Advisor"
      role="status"
    >
      {/* Sidebar skeleton */}
      <aside
        className="hidden lg:flex flex-col shrink-0 border-r border-[#1e2a3a]"
        style={{ width: '260px', background: '#0d1424' }}
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-[#1e2a3a]">
          <div className="flex items-center gap-2">
            <div
              className="rounded-lg shrink-0"
              style={{ width: '28px', height: '28px', background: '#1e2a3a' }}
            />
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-20 rounded" style={{ background: '#1e2a3a' }} />
              <div className="h-2 w-28 rounded" style={{ background: '#1e2a3a' }} />
            </div>
          </div>
        </div>

        {/* Net worth card skeleton */}
        <div className="px-4 pt-4">
          <div
            className="rounded-lg p-3 mb-3"
            style={{ background: '#111827', border: '1px solid #1e2a3a' }}
          >
            <div className="h-2 w-16 rounded mb-2" style={{ background: '#1e2a3a' }} />
            <div className="h-6 w-24 rounded" style={{ background: '#1e2a3a' }} />
          </div>

          {/* Stat rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: '1px solid #1e2a3a' }}
            >
              <div className="h-2.5 w-24 rounded" style={{ background: '#1e2a3a' }} />
              <div className="h-2.5 w-14 rounded" style={{ background: '#1e2a3a' }} />
            </div>
          ))}
        </div>

        {/* Provider selector skeleton */}
        <div className="mt-auto px-4 py-4 border-t border-[#1e2a3a]">
          <div className="h-2 w-16 rounded mb-2" style={{ background: '#1e2a3a' }} />
          <div
            className="h-9 w-full rounded-lg"
            style={{ background: '#111827', border: '1px solid #1e2a3a' }}
          />
        </div>
      </aside>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[#1e2a3a]"
          style={{ background: '#0a0f1e' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="rounded-lg shrink-0"
              style={{ width: '32px', height: '32px', background: '#1e2a3a' }}
            />
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-32 rounded" style={{ background: '#1e2a3a' }} />
              <div className="h-2 w-44 rounded" style={{ background: '#1e2a3a' }} />
            </div>
          </div>
          <div className="h-8 w-36 rounded-lg hidden lg:block" style={{ background: '#1e2a3a' }} />
        </div>

        {/* Welcome area skeleton */}
        <div
          className="flex-1 flex flex-col items-center justify-center gap-6 px-4"
          style={{ background: '#0a0f1e' }}
        >
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl"
            style={{ background: '#1e2a3a' }}
          />

          {/* Title + description */}
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-56 rounded" style={{ background: '#1e2a3a' }} />
            <div className="h-3 w-72 rounded" style={{ background: '#1e2a3a' }} />
            <div className="h-3 w-64 rounded" style={{ background: '#1e2a3a' }} />
          </div>

          {/* Prompt cards skeleton */}
          <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-3.5 flex items-start gap-3"
                style={{ background: '#111827', border: '1px solid #1e2a3a' }}
              >
                <div
                  className="rounded shrink-0"
                  style={{ width: '15px', height: '15px', background: '#1e2a3a', marginTop: '2px' }}
                />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-2.5 w-24 rounded" style={{ background: '#1e2a3a' }} />
                  <div className="h-2 w-full rounded" style={{ background: '#1e2a3a' }} />
                  <div className="h-2 w-3/4 rounded" style={{ background: '#1e2a3a' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input skeleton */}
        <div
          className="shrink-0 px-4 py-4 border-t border-[#1e2a3a]"
          style={{ background: '#0a0f1e' }}
        >
          <div className="max-w-3xl mx-auto">
            <div
              className="h-14 w-full rounded-2xl"
              style={{ background: '#111827', border: '1px solid #1e2a3a' }}
            />
            <div className="h-2 w-64 rounded mx-auto mt-2" style={{ background: '#1e2a3a' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
