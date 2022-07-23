import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { CssBaseline, GeistProvider } from '@geist-ui/core'
import { withTRPC } from '@trpc/next'
import { AppRouter } from '@backend/router'

function MyApp({ Component, pageProps }: AppProps) {
  return(
    <GeistProvider>
      <CssBaseline />
      <Component {...pageProps} />
    </GeistProvider>
  )
}

export default withTRPC<AppRouter>({
  config({ ctx }) {
    const url = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api` : `https://localhost:3000/api`

    return { url };
  }, 
  ssr: true
})(MyApp);
