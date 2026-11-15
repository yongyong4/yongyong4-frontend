import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      // tsconfig.app.json의 paths(@/*)를 그대로 사용
      tsconfigPaths: true,
    },
    server: {
      // 개발 중 /api 요청을 BE 서버로 넘겨 CORS 문제를 피함
      proxy: {
        // 시연용: 경로 탐색만 다른 BE(예: 배포 서버)로 보냄. 로컬 데모 BE에서 ODsay 경로 탐색이 안 될 때 사용
        // 값이 없으면 이 규칙은 없고 아래 /api 규칙을 그대로 씀. 더 구체적인 경로라 /api보다 먼저 둠
        ...(env.VITE_ROUTE_SEARCH_PROXY_TARGET
          ? {
              '/api/v1/routes/search': {
                target: env.VITE_ROUTE_SEARCH_PROXY_TARGET,
                changeOrigin: true,
              },
            }
          : {}),
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  }
})
