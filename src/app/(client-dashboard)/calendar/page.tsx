'use client'

import { useState } from 'react'
import { CalendarIcon, Video, CheckCircle, Clock, Trash2, Apple, Dumbbell, User, Plus } from 'lucide-react'
import { useCalendarEvents, useCreateCalendarEvent, useDeleteCalendarEvent, useProfile } from '@/hooks/use-data'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/card'
import { Input, FormField } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'

const EVENT_ICONS: Record<string, React.ElementType> = {
  workout: Dumbbell,
  nutrition: Apple,
  video_call: Video,
  other: CalendarIcon,
}

const EVENT_COLORS: Record<string, string> = {
  workout: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  nutrition: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  video_call: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  other: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
}

const formatDate = (d: string) => {
  const date = new Date(d)
  const today = new Date()
  const tmrw = new Date()
  tmrw.setDate(today.getDate() + 1)
  
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === tmrw.toDateString()) return 'Tomorrow'
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(date)
}

const formatTime = (d: string) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(d))

export default function ClientCalendarPage() {
  const { data: profile } = useProfile()
  const { data: events, isLoading } = useCalendarEvents()
  const createEvent = useCreateCalendarEvent()
  const deleteEvent = useDeleteCalendarEvent()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ title: '1:1 Video Call Request', date: '', time: '', description: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    // Since a client only has one trainer at a time usually, we can fetch their trainer id or assign it based on their active trainer.
    // For simplicity, we fetch their active trainer assigned to them.
    const supabase = createClient()
    const { data: tc } = await supabase.from('trainer_clients').select('trainer_id').eq('client_id', profile.id).eq('status', 'active').single()
    
    if (!tc) {
      alert("You don't have an active trainer assigned.")
      return
    }

    const startDateTime = new Date(`${form.date}T${form.time}`)
    const endDateTime = new Date(startDateTime)
    endDateTime.setMinutes(startDateTime.getMinutes() + 30) // Default 30 min duration

    await createEvent.mutateAsync({
      trainer_id: tc.trainer_id,
      client_id: profile.id,
      event_type: 'video_call',
      title: form.title,
      description: form.description || null,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      status: 'pending',
      meeting_link: null
    })

    setDialogOpen(false)
    setForm({ title: '1:1 Video Call Request', date: '', time: '', description: '' })
  }

  const groupedEvents = (events ?? []).reduce((acc, event) => {
    const key = new Date(event.start_time).toDateString()
    if (!acc[key]) acc[key] = []
    acc[key].push(event)
    return acc
  }, {} as Record<string, typeof events>)

  const sortedDates = Object.keys(groupedEvents).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Schedule & Bookings"
        description="View your upcoming assignments and request 1:1 calls with your trainer."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-sky-500 hover:bg-sky-600 text-white border-0">
                <Video className="h-4 w-4 mr-1.5" /> Book 1:1 Call
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request a 1:1 Video Call</DialogTitle>
                <DialogDescription>Select a proposed time to schedule a quick sync with your trainer.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Proposed Date">
                  <Input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </FormField>
                <FormField label="Proposed Time">
                  <Input type="time" required value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
                </FormField>
                <FormField label="Topic / Description (Optional)">
                  <Input placeholder="What would you like to discuss?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </FormField>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" loading={createEvent.isPending}>Submit Request</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {isLoading ? (
            <div className="space-y-4">
               {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : sortedDates.length === 0 ? (
            <div className="text-center py-16">
              <CalendarIcon className="h-10 w-10 text-border mx-auto mb-3" />
              <p className="text-sm text-text-tertiary">No upcoming events or bookings scheduled.</p>
            </div>
          ) : (
            sortedDates.map(dateStr => (
              <div key={dateStr}>
                <h3 className="text-sm font-semibold tracking-wider text-text-secondary uppercase mb-4 pl-1 border-l-2 border-sky-500">
                  {formatDate(dateStr)}
                </h3>
                <div className="space-y-3">
                  {groupedEvents[dateStr]!.map(event => {
                    const Icon = EVENT_ICONS[event.event_type] ?? CalendarIcon
                    const colorClass = EVENT_COLORS[event.event_type]
                    
                    return (
                      <Card key={event.id} className="group hover:border-text-faint transition-colors overflow-hidden">
                        <div className="flex">
                           <div className={`w-1.5 ${event.status === 'pending' ? 'bg-amber-500' : event.status === 'scheduled' ? 'bg-emerald-500' : 'bg-surface-2'}`} />
                           <CardContent className="p-4 flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
                             <div className="flex items-center gap-4 flex-1 min-w-0">
                               <div className={`h-10 w-10 shrink-0 rounded-lg border flex items-center justify-center ${colorClass}`}>
                                 <Icon className="h-5 w-5" />
                               </div>
                               <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-bold text-text-primary truncate">{event.title}</h4>
                                    {event.status === 'pending' && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                        Pending Approval
                                      </span>
                                    )}
                                    {event.status === 'scheduled' && event.event_type === 'video_call' && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                        Confirmed
                                      </span>
                                    )}
                                 </div>
                                 <p className="text-xs text-text-tertiary flex items-center gap-3">
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                                 </p>
                                 {event.description && <p className="text-xs text-text-muted mt-2 truncate">{event.description}</p>}
                               </div>
                             </div>

                             <div className="flex items-center gap-2 sm:ml-auto">
                               {event.meeting_link && event.status === 'scheduled' && (
                                 <Button size="sm" asChild className="bg-sky-500/10 text-sky-400 hover:bg-sky-500/20">
                                   <a href={event.meeting_link} target="_blank" rel="noopener noreferrer"><Video className="h-3.5 w-3.5" /> Join Call</a>
                                 </Button>
                               )}
                               {event.status === 'pending' && (
                                 <button 
                                   type="button"
                                   title="Cancel Request"
                                   onClick={() => {
                                     if(confirm('Cancel this request?')) deleteEvent.mutate(event.id)
                                   }}
                                   className="h-8 w-8 inline-flex items-center justify-center rounded-md text-text-faint hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                 >
                                   <Trash2 className="h-4 w-4" />
                                 </button>
                               )}
                             </div>
                           </CardContent>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-sky-500/20 bg-sky-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-sky-400"><Video className="h-4 w-4" /> 1:1 Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-text-tertiary leading-relaxed mb-4">
                Use the Book 1:1 Call button to request a video meeting with your trainer. They will review your request and send a meeting link.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
