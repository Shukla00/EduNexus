import { useEffect, useMemo, useState } from 'react'
import { Calendar, Clock, MapPin, BookOpen } from 'lucide-react'
import { timetableApi } from '../../services/api'
import toast from 'react-hot-toast'

const getList = (data) => data.results || data || []
const getTime = (value) => value?.slice(0, 5) || ''
const getSlotTime = (entry) => {
  const slot = entry.time_slot_detail
  if (!slot) return 'Time not set'
  return `${getTime(slot.start_time)} - ${getTime(slot.end_time)}`
}
const formatDate = (date) => {
  if (!date) return 'No Date Assigned'
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
const sortByDateAndTime = (a, b) => {
  const dateCompare = String(a.date || '9999-12-31').localeCompare(String(b.date || '9999-12-31'))
  if (dateCompare) return dateCompare
  return String(a.time_slot_detail?.start_time || '').localeCompare(String(b.time_slot_detail?.start_time || ''))
}

export default function FacultyTimetable() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await timetableApi.my()
        setEntries(getList(res.data))
      } catch (err) {
        console.error('Failed to load timetable', err)
        toast.error('Failed to load timetable')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const visibleEntries = useMemo(() => {
    const filtered = filterDate
      ? entries.filter(entry => entry.date === filterDate)
      : entries
    return [...filtered].sort(sortByDateAndTime)
  }, [entries, filterDate])

  const groupedEntries = useMemo(() => {
    return visibleEntries.reduce((groups, entry) => {
      const key = entry.date || 'no-date'
      if (!groups[key]) groups[key] = []
      groups[key].push(entry)
      return groups
    }, {})
  }, [visibleEntries])

  const groupedDates = Object.keys(groupedEntries).sort((a, b) => {
    if (a === 'no-date') return 1
    if (b === 'no-date') return -1
    return a.localeCompare(b)
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="page-title">My Timetable</h1>
          <p className="page-subtitle">Your lecture schedule by date</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            className="input w-44"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
          {filterDate && (
            <button className="btn-secondary" onClick={() => setFilterDate('')}>Clear</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display">{groupedDates.filter(d => d !== 'no-date').length}</p>
            <p className="text-sm text-slate-500">Scheduled Dates</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display">{visibleEntries.length}</p>
            <p className="text-sm text-slate-500">Lectures</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display">
              {new Set(visibleEntries.map(entry => entry.course).filter(Boolean)).size}
            </p>
            <p className="text-sm text-slate-500">Subjects</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
        </div>
      ) : visibleEntries.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 flex flex-col items-center">
          <Calendar className="w-12 h-12 text-slate-300 mb-3" />
          <p>{filterDate ? 'No lectures scheduled for this date.' : 'No lectures assigned yet.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedDates.map(dateKey => (
            <section key={dateKey} className="card overflow-hidden">
              <div className="bg-surface-50 px-5 py-3 border-b border-surface-200">
                <h2 className="font-bold text-slate-900">{formatDate(dateKey === 'no-date' ? null : dateKey)}</h2>
              </div>
              <div className="divide-y divide-surface-100">
                {groupedEntries[dateKey]
                  .sort((a, b) => String(a.time_slot_detail?.start_time || '').localeCompare(String(b.time_slot_detail?.start_time || '')))
                  .map(entry => (
                    <div key={entry.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="md:w-36">
                        <p className="text-sm font-bold text-primary-700">{getSlotTime(entry)}</p>
                        <p className="text-xs text-slate-400">{entry.time_slot_detail?.day_display || entry.time_slot_detail?.day || ''}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900">{entry.course_code} - {entry.course_name}</p>
                        <p className="text-sm text-slate-500 truncate">{entry.department_name} | Semester {entry.semester}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="w-4 h-4" />
                        <span>Room {entry.room || 'TBA'}</span>
                      </div>
                      {entry.date && (
                        <a className="btn-secondary btn-sm" href={`/faculty/attendance?date=${entry.date}&entry=${entry.id}`}>
                          Mark Attendance
                        </a>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
