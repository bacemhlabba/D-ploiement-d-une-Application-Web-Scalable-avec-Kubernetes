import Head from "next/head"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <Head>
        <title>Gestion de Congés</title>
        <meta name="description" content="Application de gestion de congés" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold mb-6">Bienvenue sur l'application de Gestion de Congés</h1>

        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
          <Link
            href="/login"
            className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-blue-600 focus:text-blue-600"
          >
            <h3 className="text-2xl font-bold">Se connecter &rarr;</h3>
            <p className="mt-4 text-xl">Accédez à votre compte pour gérer vos congés.</p>
          </Link>

          <Link
            href="/register"
            className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-blue-600 focus:text-blue-600"
          >
            <h3 className="text-2xl font-bold">S'inscrire &rarr;</h3>
            <p className="mt-4 text-xl">Créez un compte pour commencer à utiliser l'application.</p>
          </Link>
        </div>
      </main>

      <footer className="flex items-center justify-center w-full h-24 border-t">
        <p>© 2025 Gestion de Congés. Tous droits réservés.</p>
      </footer>
    </div>
  )
}
