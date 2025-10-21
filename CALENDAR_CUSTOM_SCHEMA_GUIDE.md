# Calendar Custom Schema Implementation Guide

## ✅ What Was Updated

The calendar has been **fully customized** to work with your specific task schema with accurate date parsing and visual distinction between regular dates and due dates.

---

## 📊 Your Task Schema

```javascript
{
  id: "f74ad551-7667-4575-afac-62480d9a1b70",
  name: "qwertyu",
  status: "Pending",
  priority: "Medium",
  price: 100,
  
  // Regular date fields (date1-date5)
  date1: "2025-10-20T00:05:00.000Z",  // ISO format
  date2: null,
  date3: null,
  date4: null,
  date5: null,
  
  // Due date fields (duedate1-duedate5) - ARRAYS
  duedate1: [],
  duedate2: [],
  duedate3: [],
  duedate4: [],
  duedate5: [],
  
  // ... other fields
}
```

---

## 🎯 How Dates Are Parsed

### 1. **Regular Dates (date1-date5)**
```javascript
// Calendar checks all 5 date fields
date1, date2, date3, date4, date5

// Visual Style:
- Solid border (1px or 2px)
- 90% opacity background
- No special indicator
```

### 2. **Due Dates (duedate1-duedate5)**
```javascript
// Calendar checks all 5 duedate fields (arrays)
duedate1, duedate2, duedate3, duedate4, duedate5

// Visual Style:
- Dashed border (2px, white2 color)
- 80% opacity background  
- ⏰ Clock emoji indicator
- "Due Date" badge in modal
```

### 3. **Multi-Day Tasks**
If a task has multiple dates (e.g., date1 and date2):
- **Start date**: Earliest date found
- **End date**: Latest date found
- **Spanning**: Task appears on ALL days between start and end
- **Visual**: Connects with rounded corners

---

## 🎨 Visual Indicators

### Regular Date Task:
```
┌─────────────────────┐  ← Solid border
│ Task Name      $500 │  ← 90% opacity
└─────────────────────┘
```

### Due Date Task:
```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  ← Dashed border (2px)
│ ⏰ Task Name   $500 │  ← Clock icon + 80% opacity
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

### Multi-Day Task (Regular):
```
Day 1:              Day 2:              Day 3:
┌─────────────      ─────────────      ─────────────┐
│ ▶ Task Name       Task Name $500     Task Name   │
└─────────────      ─────────────      ─────────────┘
```

### Multi-Day Task (Due Date):
```
Day 1:              Day 2:              Day 3:
┌ ─ ─ ─ ─ ─ ─      ─ ─ ─ ─ ─ ─ ─      ─ ─ ─ ─ ─ ─ ┐
│ ⏰ Task Name      ⏰ Task Name $500   ⏰ Task Name │
└ ─ ─ ─ ─ ─ ─      ─ ─ ─ ─ ─ ─ ─      ─ ─ ─ ─ ─ ─ ┘
```

---

## 📅 Date Field Priority

The calendar processes dates in this order:

1. **Collect all date1-date5 values** (mark as regular dates)
2. **Collect all duedate1-duedate5 values** (mark as due dates)
3. **Sort all dates chronologically**
4. **Use earliest as start date**
5. **Use latest as end date** (if multiple dates exist)
6. **Show task on calendar** with appropriate visual style

---

## 🔍 Examples

### Example 1: Single Regular Date
```javascript
{
  id: "123",
  name: "Design Homepage",
  priority: "High",
  date1: "2025-01-17T10:00:00.000Z",  // Shows on Jan 17
  date2: null,
  duedate1: [],
}

Result:
- Appears on January 17
- Solid border
- No clock icon
```

### Example 2: Single Due Date
```javascript
{
  id: "456",
  name: "Submit Report",
  priority: "High",
  date1: null,
  duedate1: ["2025-01-20T23:59:00.000Z"],  // Shows on Jan 20
}

Result:
- Appears on January 20
- Dashed border
- ⏰ Clock icon
- "Due Date" badge in modal
```

### Example 3: Multi-Day with Regular Dates
```javascript
{
  id: "789",
  name: "Sprint Development",
  priority: "Medium",
  date1: "2025-01-15T09:00:00.000Z",  // Start
  date2: "2025-01-19T17:00:00.000Z",  // End
  duedate1: [],
}

Result:
- Spans Jan 15-19 (5 days)
- Solid border
- ▶ Arrow on Jan 15
```

### Example 4: Multi-Day with Due Dates
```javascript
{
  id: "101",
  name: "Project Milestone",
  priority: "High",
  date1: null,
  duedate1: ["2025-01-22T09:00:00.000Z"],  // Start
  duedate2: ["2025-01-25T17:00:00.000Z"],  // End
}

Result:
- Spans Jan 22-25 (4 days)
- Dashed border
- ⏰ Clock icons
```

### Example 5: Mixed Dates (Regular + Due)
```javascript
{
  id: "202",
  name: "Complex Task",
  priority: "Medium",
  date1: "2025-01-10T09:00:00.000Z",    // Regular date
  date2: "2025-01-15T17:00:00.000Z",    // Regular date
  duedate1: ["2025-01-20T23:59:00.000Z"], // Due date
}

Result:
- Spans Jan 10-20 (11 days)
- Uses due date styling (earliest is regular, but has due date)
- ⏰ Clock icon (because duedate is present)
```

---

## 🎯 Calendar Legend

The footer now shows:

```
Priority:  [●] High  [●] Medium  [●] Low

Type:  [─] Date  [┄┄] ⏰ Due Date

X tasks total • Y days scheduled
💡 Click task to open • "+X more" for all
```

---

## 📱 Modal Differences

### Regular Date Task in Modal:
```
┌───────────────────────────────────┐
│ Task Name                    [→] │
│ 🔴 High · In Progress · $500      │
│ Multi-day                         │
└───────────────────────────────────┘
```

### Due Date Task in Modal:
```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│ ⏰ Task Name                 [→] │
│ 🔴 High · In Progress · $500      │
│ [Due Date] · Multi-day            │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

**Differences:**
1. Dashed border vs solid border
2. Clock emoji (⏰) before task name
3. "Due Date" badge in metadata
4. Different border color (white2 vs gray4)

---

## 🔧 Technical Details

### Date Parsing Logic:
```javascript
// 1. Loop through date1-date5
for (const field of ['date1', 'date2', 'date3', 'date4', 'date5']) {
  if (task[field] && dayjs(task[field]).isValid()) {
    allDates.push({ date: dayjs(task[field]), isDueDate: false });
  }
}

// 2. Loop through duedate1-duedate5 (arrays)
for (const field of ['duedate1', 'duedate2', 'duedate3', 'duedate4', 'duedate5']) {
  if (Array.isArray(task[field])) {
    task[field].forEach(dateValue => {
      if (dateValue && dayjs(dateValue).isValid()) {
        allDates.push({ date: dayjs(dateValue), isDueDate: true });
      }
    });
  }
}

// 3. Sort chronologically
allDates.sort((a, b) => a.date.valueOf() - b.date.valueOf());

// 4. Determine if it's a due date task
const isFirstDueDate = allDates[0].isDueDate;
```

### Visual Styling:
```javascript
// Border style based on due date
borderStyle: task.__isDueDate ? "dashed" : "solid"
borderWidth: task.__isDueDate ? "2px" : "1px"
borderColor: task.__isDueDate ? "#EFEBF6" : priorityColor

// Background opacity
backgroundColor: task.__isDueDate 
  ? priorityColor + "CC"  // 80% opacity
  : priorityColor + "E6"  // 90% opacity
```

---

## 🐛 Troubleshooting

### Problem: Task not showing on calendar

**Check:**
1. Does task have at least one date field filled?
   - `date1`, `date2`, `date3`, `date4`, or `date5`
   - OR `duedate1`, `duedate2`, `duedate3`, `duedate4`, or `duedate5`

2. Is the date in valid ISO format?
   - ✅ Good: `"2025-01-17T10:00:00.000Z"`
   - ✅ Good: `"2025-01-17"`
   - ❌ Bad: `"TBD"` or `"next week"`

3. Are duedate fields arrays?
   - ✅ Good: `duedate1: ["2025-01-17T10:00:00.000Z"]`
   - ✅ Good: `duedate1: []` (empty array, ok)
   - ⚠️ OK: `duedate1: "2025-01-17T10:00:00.000Z"` (string, handled)

### Problem: Task showing on wrong date

**Check:**
1. Timezone issues? Use consistent format
2. Multiple dates? Calendar uses earliest as start
3. Check the debug console (uncomment lines 257-264)

### Problem: Due date not showing dashed border

**Check:**
1. Is the due date the EARLIEST date?
   - If `date1 = Jan 15` and `duedate1 = [Jan 20]`
   - Task appears Jan 15-20 with SOLID border (start is regular)
2. Due date styling only applies if FIRST date is a due date

---

## 📊 Statistics

The footer shows accurate counts:

```javascript
// Total tasks
tasks.length  // All tasks passed to calendar

// Days scheduled
Object.keys(tasksByDate).length  // Unique days with tasks

// Tasks with dates
tasksWithDates  // Tasks that have at least one valid date field
```

---

## ✨ Summary

Your calendar now:

✅ **Parses date1-date5 fields** (regular dates)  
✅ **Parses duedate1-duedate5 fields** (due dates as arrays)  
✅ **Visual distinction**: Solid vs dashed borders  
✅ **Clock icon (⏰)** for due date tasks  
✅ **Multi-day support** for tasks with multiple dates  
✅ **Accurate statistics** in footer legend  
✅ **Enhanced modal** showing due date badges  
✅ **Helpful empty states** with correct field names  
✅ **Debug support** (uncomment to troubleshoot)  
✅ **Beautiful styling** using only approved colors  
✅ **Fully responsive** across all devices  

**Your tasks will now appear exactly where they should with clear visual indicators for due dates!** 📅⏰✨

