"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TableComponent from "@/components/events/tableEvents";
import { fetchEvents } from "@/services/events";
import { Event } from "@/types/types"

export default function Page() {
  const [data, setData] = useState<Event[]>([]);

  const loadEvents = async () => {
    const fetchedData = await fetchEvents();
    setData(fetchedData);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <TableComponent 
          title="Eventos" 
          data={data} 
          onEventCreated={loadEvents}
        />
      </div>
    </div>
  );
}

