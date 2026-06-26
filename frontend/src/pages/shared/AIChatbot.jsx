import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Bot, Clock3, FileText, MessageSquareText, Send, UploadCloud, UserRound, Trash2 } from 'lucide-react'
import { aiApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export default function AIChatbot() {
  const { user } = useAuth()
  const canUpload = ['ADMIN', 'FACULTY'].includes(user?.role)
  const canChat = !!user
  const [documents, setDocuments] = useState([])
  const [studentSummary, setStudentSummary] = useState(null)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Ask about uploaded PDFs, attendance, marks, timetable, or your student profile.' },
  ])
  const [asking, setAsking] = useState(false)
  const [thinkingSeconds, setThinkingSeconds] = useState(0)

  const loadDocuments = async () => {
    try {
      const { data } = await aiApi.documents()
      setDocuments(data)
    } catch {
      toast.error('Failed to load AI documents')
    }
  }

  useEffect(() => { loadDocuments() }, [])

  useEffect(() => {
    if (!canChat) return

    const loadStudentSummary = async () => {
      try {
        const { data } = await aiApi.studentSummary()
        setStudentSummary(data.student)
      } catch {
        setStudentSummary(null)
      }
    }

    loadStudentSummary()
  }, [canChat])

  useEffect(() => {
    if (!asking) {
      setThinkingSeconds(0)
      return undefined
    }

    const timer = window.setInterval(() => {
      setThinkingSeconds(prev => prev + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [asking])

  const uploadLabel = useMemo(() => {
    if (!file) return 'Select PDF'
    return file.name.length > 34 ? `${file.name.slice(0, 31)}...` : file.name
  }, [file])

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!file) {
      toast.error('Choose a PDF first')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    if (title.trim()) formData.append('title', title.trim())

    setUploading(true)
    try {
      await aiApi.uploadDocument(formData)
      toast.success('PDF indexed for chatbot answers')
      setTitle('')
      setFile(null)
      event.target.reset()
      loadDocuments()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleAsk = async (event) => {
    event.preventDefault()
    const question = prompt.trim()
    if (!question) return

    setPrompt('')
    setMessages(prev => [...prev, { role: 'user', text: question }])
    setAsking(true)
    try {
      const { data } = await aiApi.chat(question)
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: data.response,
        sources: data.sources || [],
        elapsedMs: data.elapsed_ms,
      }])
    } catch (error) {
      toast.error(error.response?.data?.message || 'AI response failed')
      setMessages(prev => [...prev, { role: 'assistant', text: 'I could not answer that request right now.' }])
    } finally {
      setAsking(false)
    }
  }

  const handleDelete = async (id) => {

    if (!window.confirm("Delete this PDF?"))
      return

    try {

      await aiApi.deleteDocument(id)

      toast.success("Document deleted")

      loadDocuments()

    } catch {

      toast.error("Delete failed")

    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <MessageSquareText className="w-6 h-6 text-primary-600" />
            AI Chatbot
          </h1>
          <p className="page-subtitle">Answers from PDFs and ERP data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
        <div className="space-y-5">
          {canUpload && (
            <form onSubmit={handleUpload} className="card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-primary-600" />
                <h2 className="font-semibold text-slate-900">Upload PDF</h2>
              </div>
              <input
                className="input"
                placeholder="Document title"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <label className="btn-secondary w-full cursor-pointer">
                <FileText className="w-4 h-4" />
                <span className="truncate">{uploadLabel}</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </label>
              <button className="btn-primary w-full" type="submit" disabled={uploading}>
                <UploadCloud className="w-4 h-4" />
                {uploading ? 'Indexing...' : 'Upload'}
              </button>
            </form>
          )}

          {user?.role === 'STUDENT' && studentSummary &&(
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <UserRound className="w-5 h-5 text-primary-600" />
                <h2 className="font-semibold text-slate-900">Student Details</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-surface-50 p-3">
                  <p className="text-xs text-slate-500">Name</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">{studentSummary.name}</p>
                </div>
                <div className="rounded-lg bg-surface-50 p-3">
                  <p className="text-xs text-slate-500">Enrollment</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">{studentSummary.enrollment}</p>
                </div>
                <div className="rounded-lg bg-surface-50 p-3">
                  <p className="text-xs text-slate-500">Department</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">{studentSummary.department}</p>
                </div>
                <div className="rounded-lg bg-surface-50 p-3">
                  <p className="text-xs text-slate-500">Semester</p>
                  <p className="text-sm font-semibold text-slate-900">Sem {studentSummary.semester}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-surface-200 p-3 text-center">
                  <p className="text-lg font-bold text-slate-900">{studentSummary.attendance}%</p>
                  <p className="text-xs text-slate-500">Attendance</p>
                </div>
                <div className="rounded-lg border border-surface-200 p-3 text-center">
                  <p className="text-lg font-bold text-slate-900">{studentSummary.average_marks}%</p>
                  <p className="text-xs text-slate-500">Avg Marks</p>
                </div>
                <div className="rounded-lg border border-surface-200 p-3 text-center">
                  <p className="text-lg font-bold text-slate-900">{studentSummary.risk_level}</p>
                  <p className="text-xs text-slate-500">Risk</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Courses</p>
                <div className="flex flex-wrap gap-1.5">
                  {studentSummary.courses?.length ? studentSummary.courses.map(course => (
                    <span key={course.code} className="badge-blue">{course.code}</span>
                  )) : <span className="badge-gray">No courses</span>}
                </div>
              </div>
            </div>
          )}

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-600" />
                <h2 className="font-semibold text-slate-900">PDF Library</h2>
              </div>
              <span className="badge-gray">{documents.length}</span>
            </div>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {documents.length === 0 ? (
                <p className="text-sm text-slate-500 bg-surface-50 rounded-lg p-3">No PDFs uploaded yet.</p>
              ) : documents.map(doc => (
                <div
                  key={doc.id}
                  className="border border-surface-200 rounded-lg p-3 bg-white"
                >

                  <div className="flex justify-between items-start">

                    <p className="text-sm font-semibold text-slate-800 break-words">
                      {doc.title}
                    </p>

                    {canUpload && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">

                    <span className="badge-blue">
                      {doc.chunk_count || 0} chunks
                    </span>

                    {doc.uploaded_by_name && (
                      <span className="badge-gray">
                        {doc.uploaded_by_name}
                      </span>
                    )}

                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card min-h-[680px] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-surface-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-slate-900">Student Assistant</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-50/60">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-xl px-4 py-3 text-sm shadow-sm ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-slate-700 border border-surface-200'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  {message.sources?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {message.sources.map((source, sourceIndex) => (
                        <span key={`${source.document}-${source.page}-${sourceIndex}`} className="badge-gray">
                          {source.document} p.{source.page}
                        </span>
                      ))}
                    </div>
                  )}
                  {message.elapsedMs && (
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
                      <Clock3 className="w-3.5 h-3.5" />
                      Answered in {(message.elapsedMs / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>
              </div>
            ))}
            {asking && (
              <div className="flex justify-start">
                <div className="bg-white border border-surface-200 rounded-xl px-4 py-3 text-sm text-slate-600 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                    <span className="font-medium">Preparing answer</span>
                    <span className="text-slate-400">{thinkingSeconds}s</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Checking PDFs and ERP details</p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleAsk} className="p-4 border-t border-surface-100 bg-white flex gap-3">
            <input
              className="input"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={
                canChat
                  ? 'Ask from PDFs and ERP data'
                  : 'Login required'
              }
              disabled={!canChat || asking}
            />
            <button className="btn-primary px-4" type="submit" disabled={!canChat || asking || !prompt.trim()}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
