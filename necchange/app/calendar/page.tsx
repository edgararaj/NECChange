"use client";
import Image from "next/image";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import googleCalendarPlugin from "@fullcalendar/google-calendar";
import axios from "axios";
import { use } from "react";
import { useEffect, useState } from "react";

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    axios.get("api/getCalendar").then((res) => setEvents(res.data.response));
  }, []);
  return (
    <main className="max-h-screen">
      <div className="p-14 overflow-y-scroll max-h-[60%] calendar-container">
        <FullCalendar
          plugins={[dayGridPlugin, googleCalendarPlugin]}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth",
          }}
          initialView="dayGridMonth"
          displayEventTime={false}
          events={events}
          height="80vh"
        />
      </div>
    </main>
  );
}
