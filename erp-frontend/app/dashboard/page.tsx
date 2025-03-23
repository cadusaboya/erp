"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
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

  const loadEvents = async (activeFilters: FiltersEventType) => {
    const fetchedData = await fetchEvents(activeFilters);
    setData(fetchedData);
  };

  useEffect(() => {
    loadEvents(filters);
  }, [filters]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <TableComponent
          title="Eventos"
          data={data}
          filters={filters}                  // ✅ Pass filters to child
          setFilters={setFilters}            // ✅ Pass setter to child
          onEventCreated={() => loadEvents(filters)} // Refresh events when needed
        />
      </div>
    </div>
  );
}
