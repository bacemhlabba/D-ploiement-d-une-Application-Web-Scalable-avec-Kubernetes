import Head from "next/head"

const DashboardDebug = () => {
  return (
    <>
      <Head>
        <title>Debug Dashboard | Gestion de Congés</title>
      </Head>
      <div className="min-h-screen bg-gray-100 p-6">
        <h1 className="text-2xl font-bold mb-6">Debug Dashboard</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p>This is a simple debug dashboard page.</p>
        </div>
      </div>
    </>
  )
}

export default DashboardDebug
