# Calendar Date Handling - Technical Reference

## Overview
The SheetCalendar component now has **robust date parsing** and **accurate task placement** on calendar dates with beautiful, consistent styling.

---

## ✅ What Was Enhanced

### 1. **Flexible Date Field Parsing**
The calendar now checks multiple possible field names for dates:

**Start Date Fields** (checked in order):
- `startDate`
- `start_date`
- `date`
- `dueDate`
- `due_date`

**End Date Fields** (checked in order):
- `endDate`
- `end_date`
- `deadline`

This ensures compatibility with various backend naming conventions.

### 2. **Robust Date Validation**
- Uses dayjs to parse dates in multiple formats
- Validates each parsed date before using it
- Skips tasks with invalid or missing dates
- Safety limit of 365 days for multi-day tasks (prevents infinite loops)

### 3. **Enhanced Visual Styling**

#### Task Badge Improvements:
```css
- Border: 1px solid border matching task color
- Background: 90% opacity color (E6)
- Text: #EFEBF6 (white from palette)
- Hover: Scale 1.02x + shadow + white overlay (10% opacity)
- Price badge: White/20 background with rounded corners
- Multi-day indicators: Arrow (▶) on start day
- Smooth corners: Rounded-l-none for middle days
```

#### Overflow Badge:
```css
- Background: gray4/80 with border
- Hover: Pink2 background with border and shadow
- Clickable: Opens modal with all tasks
```

### 4. **Smart Empty States**

#### No Tasks At All:
```
📅 Icon (pink2)
"No Tasks Scheduled"
Description + CTA button
```

#### Tasks Exist But No Dates:
```
📅 Icon (yellow)
"Add Dates to Your Tasks"
Shows count: "You have X tasks..."
💡 Tip box with instructions
```

### 5. **Statistics Footer**
When tasks are displayed:
```
Priority Legend: [High] [Medium] [Low]
Statistics: "X tasks total • Y days scheduled"
Interaction hint: 💡 Click instructions
```

### 6. **Debug Support**
Commented debug code (uncomment to troubleshoot):
```javascript
// React.useEffect(() => {
//   console.log('📅 Calendar Debug:', {
//     totalTasks: tasks?.length || 0,
//     tasksWithDates,
//     daysWithTasks: Object.keys(tasksByDate).length,
//     tasksByDate: Object.entries(tasksByDate).slice(0, 5),
//   });
// }, [tasks, tasksWithDates, tasksByDate]);
```

---

## 📊 Date Parsing Algorithm

```javascript
// For each task:
1. Try to find a valid start date from possible fields
2. If found, try to find a valid end date from possible fields
3. If both dates valid and end > start:
   - Create multi-day task spanning all days
   - Mark first day with __isStart: true
   - Mark last day with __isEnd: true
   - Add __isMultiDay: true flag
4. If only start date:
   - Create single-day task
   - Add __isMultiDay: false flag
5. Store in dateMap with key "YYYY-MM-DD"
```

---

## 🎨 Task Display on Calendar

### Single-Day Task:
```
┌─────────────────┐
│ Task Name  $500 │ ← Full rounded corners
└─────────────────┘
```

### Multi-Day Task (3 days):
```
Day 1:              Day 2:              Day 3:
┌─────────────      ─────────────      ─────────────┐
│ ▶ Task Name       Task Name $500     Task Name   │
└─────────────      ─────────────      ─────────────┘
  Rounded-left      No corners          Rounded-right
  Arrow indicator   Middle section      End section
```

### Overflow:
```
┌─────────────────┐
│ Task 1          │
│ Task 2     $100 │
│ Task 3          │
│ +5 more         │ ← Clickable
└─────────────────┘
```

---

## 🔍 How to Verify Tasks Are Showing

### 1. **Check Task Count**
Look at the footer statistics:
- Shows "X tasks total"
- Shows "Y days scheduled"

If "0 days scheduled" → tasks have no valid dates

### 2. **Enable Debug Console**
Uncomment the debug useEffect (lines 217-224):
```javascript
React.useEffect(() => {
  console.log('📅 Calendar Debug:', {
    totalTasks: tasks?.length || 0,
    tasksWithDates,
    daysWithTasks: Object.keys(tasksByDate).length,
    tasksByDate: Object.entries(tasksByDate).slice(0, 5),
  });
}, [tasks, tasksWithDates, tasksByDate]);
```

This will log:
- Total tasks passed to calendar
- How many have valid dates
- How many days have tasks
- Sample of tasksByDate mapping

### 3. **Check Empty State Message**
- "No Tasks Scheduled" → No tasks passed to component
- "Add Dates to Your Tasks" → Tasks exist but have no dates

---

## 🎯 Task Requirements for Calendar Display

For a task to appear on the calendar, it must have:

**Minimum:**
- At least ONE of these fields with a valid date:
  - `startDate`, `start_date`, `date`, `dueDate`, or `due_date`

**Optional (for multi-day):**
- ONE of these fields with a valid date AFTER the start date:
  - `endDate`, `end_date`, or `deadline`

**Valid Date Formats:**
- ISO 8601: `"2025-01-17"` or `"2025-01-17T10:30:00Z"`
- JavaScript Date: `"January 17, 2025"`
- Timestamp: `1737072000000`
- Any format parseable by dayjs

---

## 🐛 Troubleshooting

### Problem: Tasks not showing on calendar

**Solution 1: Check date fields**
```javascript
// In your backend/API, ensure tasks have:
{
  id: 1,
  name: "My Task",
  startDate: "2025-01-17",  // ← Required
  endDate: "2025-01-19",    // ← Optional
  priority: "High",
  // ... other fields
}
```

**Solution 2: Check date format**
```javascript
// BAD: Invalid formats
startDate: "sometime next week"
startDate: "TBD"
startDate: ""

// GOOD: Valid formats
startDate: "2025-01-17"
startDate: "2025-01-17T10:00:00Z"
startDate: new Date().toISOString()
```

**Solution 3: Enable debug logging**
- Uncomment debug code (line 217)
- Check browser console
- Verify tasks are being passed
- Check if dates are parsing correctly

### Problem: Tasks showing on wrong dates

**Check:**
1. Timezone issues? Dates might shift due to UTC conversion
2. Using local time vs UTC? Use consistent format
3. End date before start date? Task won't show

**Fix:**
```javascript
// Use ISO date strings without time for consistency
startDate: "2025-01-17"  // NOT "2025-01-16T23:00:00Z"
```

### Problem: Multi-day tasks not spanning correctly

**Check:**
1. End date must be AFTER start date
2. Both dates must be valid
3. Max span is 365 days (safety limit)

---

## 📏 Styling Specifications

### Colors (from tailwind.config.js):
```javascript
// Priority colors
High:   #DC5091 (selectRed1)
Medium: #BF7E1C (yellow)
Low:    #0EC359 (selectGreen1)

// Background colors
Main:   #222430 (grayDash)
Cards:  #20222F (gray3)
Accent: #353847 (gray4)

// Text colors
Primary:   #EFEBF6 (white)
Secondary: #777C9D (white2)

// Theme colors
Primary Action: #7658B1 (pink2)
```

### Dimensions:
```css
Task badge height: auto (1 line + padding)
Task badge padding: px-2 py-1 (8px x 4px)
Task badge font: text-xs (12px) to text-[11px] (mobile)
Task badge border: 1px solid
Task badge border-radius: 6px (rounded-md)
Overflow badge: same as task badge
Gap between badges: 4px (space-y-1)
```

### Animations:
```css
Task entrance: x: -5 → 0, delay: 50ms × index
Hover scale: 1 → 1.02
Shadow on hover: shadow-lg + shadow-black/20
Transition: 200ms duration
```

---

## 🚀 Performance Notes

### Optimizations:
1. **useMemo** for tasksByDate calculation (only recalcs when tasks change)
2. **useMemo** for tasksWithDates count (only recalcs when tasks change)
3. **useMemo** for calendarDays (only recalcs when month changes)
4. **Slice operation** limits visible tasks (max 3 per day)
5. **Staggered animations** minimal delay (50ms × index)

### Memory:
- dateMap structure: `{ "YYYY-MM-DD": [task1, task2, ...] }`
- Max 42 day cells × 3 visible tasks = 126 rendered components
- Additional tasks hidden behind "+X more" indicator

---

## 📚 Integration Example

```javascript
// In Sheets.jsx
{view === "calendar" && (
  <SheetCalendar
    tasks={tasks}  // Array with startDate/endDate fields
    columns={sheets?.columns?.filter(c => c && c.show) || []}
    onOpenTask={(taskId) => {
      setView("table");
      setSelectedTasks([taskId]);
      // ... navigation logic
    }}
  />
)}
```

---

## ✨ Summary

The calendar now:
- ✅ Parses multiple date field formats
- ✅ Validates all dates before display
- ✅ Shows tasks accurately on their dates
- ✅ Handles single-day and multi-day tasks
- ✅ Beautiful, consistent styling (no black colors!)
- ✅ Clear empty states with helpful messages
- ✅ Statistics showing task/date counts
- ✅ Debug support for troubleshooting
- ✅ Responsive across all devices
- ✅ Smooth animations and interactions

**Your tasks will now appear exactly where they should on the calendar!** 📅✨

