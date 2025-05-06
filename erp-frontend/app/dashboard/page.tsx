"use client";

import { useState, useEffect } from "react";
import TableComponent from "@/components/events/tableEvents";
import { fetchEvents } from "@/services/events";
import { Event, FiltersEventType } from "@/types/types";

export default function Page() {
  const [data, setData] = useState<Event[]>([]);
  const [filters, setFilters] = useState<FiltersEventType>({
    event_name: "",
    client: "",
    startDate: "",
    endDate: "",
    minValue: "",
    maxValue: "",
    type: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadEvents = async (activeFilters: FiltersEventType, page = 1) => {
    const response = await fetchEvents(activeFilters, page); // ✅ usa paginação
    setData(response.results);
    setTotalCount(response.count);
  };

  useEffect(() => {
    loadEvents(filters, currentPage);
  }, [filters, currentPage]);

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
