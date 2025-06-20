"use client"
import { useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { Printer } from "lucide-react"

const PrintableReport = ({ title, children, onPrint }) => {
  const componentRef = useRef()

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    onAfterPrint: onPrint,
  })

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Printer className="h-5 w-5 mr-2" />
          Imprimer
        </button>
      </div>

      <div className="hidden">
        <div ref={componentRef} className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-gray-600">Gestion de Congés - {new Date().toLocaleDateString()}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default PrintableReport
