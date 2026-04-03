'use client'

import { useState } from 'react'
import { Plus, Video, Dumbbell, Apple, Calendar as CalendarIcon, CheckCircle, Clock, Trash2, Link as LinkIcon, User } from 'lucide-react'
import { useCalendarEvents, useUpdateCalendarEvent, useDeleteCalendarEvent } from '@/hooks/use-data'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/card'

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

export default function TrainerCalendarPage() {
  const { data: events, isLoading } = useCalendarEvents()
  const updateEvent = useUpdateCalendarEvent()
  const deleteEvent = useDeleteCalendarEvent()

  // Group events by date string
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
        description="Manage your calendar, assigned schedules, and 1:1 video calls."
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" /> New Event
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Calendar List */}
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
                <h3 className="text-sm font-semibold tracking-wider text-text-secondary uppercase mb-4 pl-1 border-l-2 border-indigo-500">
                  {formatDate(dateStr)}
                </h3>
                <div className="space-y-3">
                  {groupedEvents[dateStr]!.map(event => {
                    const Icon = EVENT_ICONS[event.event_type] ?? CalendarIcon
                    const colorClass = EVENT_COLORS[event.event_type]
                    
                    return (
                      <Card key={event.id} className="group hover:border-text-faint transition-colors overflow-hidden">
                        <div className="flex">
                           {/* Status Accent Bar */}
                           <div className={`w-1.5 ${event.status === 'pending' ? 'bg-amber-500' : event.status === 'scheduled' ? 'bg-indigo-500' : 'bg-surface-2'}`} />
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
                                 </div>
                                 <p className="text-xs text-text-tertiary flex items-center gap-3">
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {event.client?.full_name}</span>
                                 </p>
                                 {event.description && <p className="text-xs text-text-muted mt-2 truncate">{event.description}</p>}
                               </div>
                             </div>

                             {/* Actions */}
                             <div className="flex items-center gap-2 sm:ml-auto">
                               {event.status === 'pending' && (
                                 <Button 
                                   size="sm" 
                                   variant="outline" 
                                   className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                                   disabled={updateEvent.isPending}
                                   onClick={() => updateEvent.mutate({ id: event.id, updates: { status: 'scheduled' } })}
                                 >
                                   <CheckCircle className="h-3.5 w-3.5" /> Approve
                                 </Button>
                               )}
                               {event.meeting_link && event.status === 'scheduled' && (
                                 <Button size="sm" asChild className="bg-sky-500/10 text-sky-400 hover:bg-sky-500/20">
                                   <a href={event.meeting_link} target="_blank" rel="noopener noreferrer"><Video className="h-3.5 w-3.5" /> Join Call</a>
                                 </Button>
                               )}
                               <button 
                                 type="button"
                                 title="Cancel Event"
                                 onClick={() => {
                                   if(confirm('Are you sure you want to delete this event?')) deleteEvent.mutate(event.id)
                                 }}
                                 className="h-8 w-8 inline-flex items-center justify-center rounded-md text-text-faint hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                               >
                                 <Trash2 className="h-4 w-4" />
                               </button>
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

        {/* Right Column: Mini Info */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
                <Video className="h-4 w-4 text-indigo-400" /> Pending Requests
              </h3>
              <p className="text-xs text-text-tertiary leading-relaxed mb-4">
                When clients request a 1:1 video call from their portal, it will appear here as <span className="text-amber-500 font-medium">Pending</span>. Approve the request to add it to your mutual schedules.
              </p>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
