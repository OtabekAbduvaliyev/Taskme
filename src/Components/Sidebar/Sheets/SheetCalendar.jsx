import React, { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { Modal, Avatar, Tooltip } from "antd";
import dayjs from "dayjs";
// NOTE: Avoid importing plugin CSS directly here to prevent the "Missing './main.css' specifier" error.
// Include FullCalendar CSS globally instead (e.g. in your main app CSS or via CDN):
//   import 'path/to/node_modules/@fullcalendar/common/main.css';
//   import 'path/to/node_modules/@fullcalendar/daygrid/main.css';
// or add the official CDN links in index.html.

const SheetCalendar = ({ tasks = [], onOpenTask }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // deterministic hash to map an id -> palette index
  const stableIndex = (id, modulo) => {
    if (id == null) return 0;
    // try numeric id first
    const n = Number(id);
    if (!Number.isNaN(n)) return Math.abs(Math.floor(n)) % modulo;
    // otherwise sum char codes
    const s = String(id);
    let sum = 0;
    for (let i = 0; i < s.length; i++) sum = (sum + s.charCodeAt(i)) | 0;
    return Math.abs(sum) % modulo;
  };

  // 5-color palette (bg + text) — change shades as you like
  const palette = [
    { background: "#F472B6", text: "#1F0A10" }, // pink
    { background: "#60A5FA", text: "#021331" }, // blue
    { background: "#34D399", text: "#02281A" }, // green
    { background: "#FBBF24", text: "#2B1700" }, // amber
    { background: "#A78BFA", text: "#110827" }, // purple
  ];

  // Build FullCalendar event objects from tasks
  const events = useMemo(() => {
    // fields to check (prioritized)
    const dateKeys = [
      "duedate",
      "duedate1",
      "duedate2",
      "duedate3",
      "duedate4",
      "duedate5",
      "dueDate",
      "due_date",
      "deadline",
      "date1",
      "date2",
      "date",
      "startDate",
      "start_date",
      "start",
    ];

    const parseVal = (raw) => {
      if (!raw && raw !== 0) return null;
      if (raw instanceof Date && !isNaN(raw)) return raw;
      // raw can be ISO string, numeric timestamp string/number, or dayjs-like
      const d = dayjs(raw);
      return d.isValid() ? d.toDate() : null;
    };

    const isDateOnlyString = (s) => {
      if (!s) return false;
      return /^\d{4}-\d{2}-\d{2}$/.test(String(s).trim());
    };

    return tasks
      .map((t) => {
        // find first available date-like field
        let rawStart = null;
        let rawEnd = null;
        for (const k of dateKeys) {
          const v = t[k];
          if (v === undefined || v === null) continue;
          // if array (range), prefer that
          if (Array.isArray(v)) {
            rawStart = v[0] || null;
            rawEnd = v[1] || null;
            break;
          }
          // otherwise single value
          rawStart = v;
          rawEnd = null;
          break;
        }

        if (!rawStart) return null;

        const start = parseVal(rawStart);
        const end = parseVal(rawEnd);
        if (!start) {
          // eslint-disable-next-line no-console
          console.warn(`[SheetCalendar] Unparsable date for task id=${t.id}`, { rawStart, rawEnd });
          return null;
        }

        // treat clearly date-only strings as allDay events
        const allDay =
          isDateOnlyString(rawStart) ||
          (!String(rawStart).includes("T") &&
            dayjs(rawStart).hour() === 0 &&
            dayjs(rawStart).minute() === 0);

        // pick palette color deterministically using task id
        const idx = stableIndex(t.id ?? t._id ?? t.name ?? "", palette.length);
        const colors = palette[idx];

        return {
          id: String(t.id),
          title: t.name || "Untitled",
          start,
          end: end || null,
          allDay,
          backgroundColor: colors.background,
          borderColor: colors.background,
          textColor: colors.text,
          extendedProps: {
            status: t.status,
            // keep description in extendedProps if needed elsewhere, but we will not render it
            description: t.description,
            assignee: t.assignee,
            original: t,
          },
        };
      })
      .filter(Boolean);
  }, [tasks]);

  return (
    <div className="calendar-view bg-grayDash rounded-xl p-4 relative">
      {/* Updated scoped style:
          - toolbar title & day numbers: light gray (gray-300)
          - weekday headers: dark grayDash background so white weekday text is readable
      */}
      <style>{`
        /* Month title (toolbar) -> gray-300 */
        .calendar-view .fc .fc-toolbar-title { color: #D1D5DB !important; }

        /* Column headers (Mon, Tue, ...) -> white text on grayDash background */
        .calendar-view .fc .fc-col-header-cell,
        .calendar-view .fc .fc-col-header-cell .fc-col-header-cell-cushion {
          color: #ffffff !important;
          background-color: #0f1724 !important; /* match grayDash-like background */
        }

        /* Day numbers in month view -> gray-300 */
        .calendar-view .fc .fc-daygrid-day-number { color: #D1D5DB !important; }

        /* Small top area inside day cell -> ensure consistency */
        .calendar-view .fc .fc-daygrid-day-top { color: #D1D5DB !important; }

        /* Event titles remain controlled by event textColor, but ensure fallback visibility */
        .calendar-view .fc .fc-event-title { color: inherit !important; }

        /* Subtle highlight for today */
        .calendar-view .fc .fc-daygrid-day.fc-day-today { background: rgba(255,255,255,0.02); }
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        height="auto"
        events={events}
        eventClick={(info) => {
          setSelectedEvent({
            id: info.event.id,
            title: info.event.title,
            start: info.event.start,
            end: info.event.end,
            extendedProps: info.event.extendedProps,
          });
          setModalOpen(true);
        }}
        dayMaxEventRows={3}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
        displayEventEnd={true}
        nowIndicator={true}
        eventDidMount={(info) => {
          if (info.event.backgroundColor) {
            info.el.style.backgroundColor = info.event.backgroundColor;
            info.el.style.borderColor = info.event.backgroundColor;
          }
          if (info.event.textColor) {
            info.el.style.color = info.event.textColor;
          }
          info.el.style.fontWeight = "600";
          info.el.style.borderRadius = "6px";
        }}
      />

      <Modal
        title={selectedEvent ? selectedEvent.title : ""}
        open={modalOpen}
        onOk={() => setModalOpen(false)}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        {selectedEvent && (
          <div className="space-y-3">
            {/* description removed per request; show status only */}
            <div className="flex items-center gap-2">
              <strong className="text-xs text-gray2">Status:</strong>
              <span
                className={`text-xs rounded px-2 py-1 ${
                  (selectedEvent.extendedProps?.status || "").toLowerCase() === "done"
                    ? "bg-green-200 text-green-700"
                    : (selectedEvent.extendedProps?.status || "").toLowerCase() === "in progress"
                    ? "bg-yellow-200 text-yellow-700"
                    : (selectedEvent.extendedProps?.status || "").toLowerCase() === "todo"
                    ? "bg-gray-300 text-gray-700"
                    : "bg-pink2/10 text-pink2"
                }`}
              >
                {selectedEvent.extendedProps?.status || "N/A"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-gray2">
                Start:{" "}
                {selectedEvent.start
                  ? new Date(selectedEvent.start).toLocaleString()
                  : "N/A"}
              </div>
              <div className="text-xs text-gray2">
                End:{" "}
                {selectedEvent.end
                  ? new Date(selectedEvent.end).toLocaleString()
                  : "N/A"}
              </div>
            </div>

            {selectedEvent.extendedProps?.assignee && (
              <div className="flex items-center gap-2">
                <Tooltip title={selectedEvent.extendedProps.assignee}>
                  <Avatar size={22} className="bg-pink2/80 text-white font-bold">
                    {typeof selectedEvent.extendedProps.assignee === "string"
                      ? selectedEvent.extendedProps.assignee[0]?.toUpperCase()
                      : "?"}
                  </Avatar>
                </Tooltip>
                <div className="text-sm text-white">
                  {selectedEvent.extendedProps.assignee}
                </div>
              </div>
            )}

            {selectedEvent.extendedProps?.original?.id && (
              <div className="mt-3">
                {/* call prop instead of using href so parent can switch view and focus */}
                <button
                  type="button"
                  className="text-pink2 text-sm font-semibold bg-transparent border-none p-0"
                  onClick={() => {
                    setModalOpen(false);
                    if (typeof onOpenTask === "function") {
                      // pass original task id (string/number)
                      const taskId = selectedEvent.extendedProps.original.id;
                      onOpenTask(taskId);
                    }
                  }}
                >
                  Open task
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SheetCalendar;
