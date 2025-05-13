// components/CompanySelector.tsx
import { useCompany } from "@/contexts/CompanyContext"
import { useEffect, useState } from "react"

type Company = {
  id: number
  name: string
}

export default function CompanySelector() {
  const { company, setCompany } = useCompany()
  const [companies, setCompanies] = useState<Company[]>([])

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/`)
      .then(res => res.json())
      .then(data => setCompanies(data))
  }, [])

  return (
    <div className="p-2">
      <label className="text-xs font-bold">Company</label>
      <select
        value={company ?? ""}
        onChange={(e) => setCompany(e.target.value || null)}
        className="w-full border p-1 rounded"
      >
        <option value="">Select Company</option>
        {companies.map(c => (
          <option key={c.id} value={String(c.id)}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  )
}
