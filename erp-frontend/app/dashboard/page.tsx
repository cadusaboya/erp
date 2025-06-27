"use client";

import { useState, useEffect } from "react";
import TableComponent from "@/components/events/tableEvents";
import { fetchEvents } from "@/services/events";
import { Event, FiltersEventType } from "@/types/types";
import { useCompany } from "@/contexts/CompanyContext";     // ✅ ADD THIS

const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

export default function Page() {
  const [data, setData] = useState<Event[]>([]);
  const [filters, setFilters] = useState<FiltersEventType>({
    event_name: "",
    client: "",
    startDate: today,
    endDate: "",
    minValue: "",
    maxValue: "",
    type: [],
    fiscal_doc: "",
    local: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { selectedCompany } = useCompany();                // ✅ ADD THIS

  const loadEvents = async (activeFilters: FiltersEventType, page = 1) => {
    const response = await fetchEvents(activeFilters, page); // ✅ paginated
    setData(response.results);
    setTotalCount(response.count);
  };

  // ✅ Refetch events when filters, page or company changes
  useEffect(() => {
    if (!selectedCompany) return;                         // ✅ avoid fetch if no company yet
    loadEvents(filters, currentPage);
  }, [filters, currentPage, selectedCompany]);            // ✅ ✅ ✅ ADD selectedCompany

  return (
    <div className="p-6">
      <TableComponent
        title="Eventos"
        data={data}
        filters={filters}
        setFilters={setFilters}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalCount={totalCount}
        onEventCreated={() => loadEvents(filters, currentPage)}
      />
    </div>
  );
}
