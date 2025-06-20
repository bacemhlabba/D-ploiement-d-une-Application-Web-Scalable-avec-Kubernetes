import "../styles/globals.css"
import Head from "next/head"
import { AuthProvider } from "../frontend/contexts/AuthContext"
import { Toaster } from "react-hot-toast"

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </AuthProvider>
  )
}

export default MyApp
