export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          🤖 Multi-Agent 开发平台
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          基于 OpenClaw 的多 Agent 协作开发系统
        </p>
        <a 
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          进入控制台
          <span>→</span>
        </a>
      </div>
    </div>
  )
}