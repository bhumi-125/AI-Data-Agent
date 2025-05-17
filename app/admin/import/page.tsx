import { Header } from "@/components/header"
import { ImportForm } from "@/components/admin/import-form"

export default function ImportPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Import Data</h1>
        <div className="max-w-2xl mx-auto">
          <ImportForm />
        </div>
      </main>
    </div>
  )
}
