'use client'

import { useState } from 'react'
import Link from 'next/link'
import { StickyNote, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useClients } from '@/hooks/use-data'
import { Card, CardContent, UserAvatar, Skeleton } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea, FormField, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/page-header'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { formatRelativeTime, STATUS_COLORS } from '@/lib/utils'
import type { Note, TrainerClient } from '@/types/database'

function useNotes(clientId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['notes', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes').select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Note[]
    },
    enabled: !!clientId,
  })
}

function AddNoteDialog({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: 'general' })
  const supabase = createClient()
  const qc = useQueryClient()

  const add = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('notes').insert({
        trainer_id: user.id,
        client_id: clientId,
        title: form.title || null,
        content: form.content,
        category: form.category,
        is_shared_with_client: false,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes', clientId] })
      setForm({ title: '', content: '', category: 'general' })
      setOpen(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
          <Plus className="h-3 w-3 mr-1" />Note
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Add Note — {clientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <FormField label="Title (optional)">
            <Input placeholder="e.g. Session 12 Feedback" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </FormField>
          <FormField label="Category">
            <Select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              <option value="general">General</option>
              <option value="session">Session</option>
              <option value="progress">Progress</option>
              <option value="nutrition">Nutrition</option>
              <option value="medical">Medical</option>
              <option value="goal">Goal</option>
            </Select>
          </FormField>
          <FormField label="Note *">
            <Textarea placeholder="Your private observations…" rows={4} value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={() => add.mutate()} loading={add.isPending}
            disabled={!form.content.trim()}>Save Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const CATEGORY_COLORS: Record<string, string> = {
  general: 'text-[#71717a]', session: 'text-indigo-400',
  progress: 'text-green-400', nutrition: 'text-yellow-400',
  medical: 'text-red-400', goal: 'text-purple-400',
}

function ClientNoteSection({ tc }: { tc: TrainerClient }) {
  const [expanded, setExpanded] = useState(true)
  const { data: notes, isLoading } = useNotes(tc.client_id)
  const client = tc.client
  if (!client) return null

  return (
    <div className="border border-[#1a1a1f] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#0d0d10] transition-colors"
      >
        <div className="flex items-center gap-3">
          <UserAvatar name={client.full_name} size="sm" />
          <div className="text-left">
            <p className="text-sm font-semibold text-[#fafafa]">{client.full_name}</p>
            <p className="text-[10px] text-[#52525b]">{notes?.length ?? 0} note{notes?.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AddNoteDialog clientId={tc.client_id} clientName={client.full_name} />
          {expanded ? <ChevronDown className="h-4 w-4 text-[#52525b]" /> : <ChevronRight className="h-4 w-4 text-[#52525b]" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#1a1a1f] p-4 bg-[#09090b]">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !notes || notes.length === 0 ? (
            <div className="text-center py-6">
              <StickyNote className="h-6 w-6 text-[#27272a] mx-auto mb-2" />
              <p className="text-xs text-[#52525b]">No notes yet — add your first observation</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notes.map(note => (
                <div key={note.id} className="rounded-lg border border-[#1a1a1f] bg-[#0d0d10] p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      {note.title && <p className="text-xs font-semibold text-[#fafafa]">{note.title}</p>}
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] capitalize font-medium ${CATEGORY_COLORS[note.category]}`}>
                          {note.category}
                        </span>
                        <span className="text-[10px] text-[#3f3f46]">{formatRelativeTime(note.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-[#a1a1aa] leading-relaxed mt-1">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function NotesPage() {
  const { data: clients, isLoading } = useClients()
  const activeClients = clients?.filter(c => c.status === 'active') ?? []

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader title="Notes" description="Private coaching notes and observations per client" />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : activeClients.length === 0 ? (
        <div className="text-center py-20">
          <StickyNote className="h-10 w-10 text-[#27272a] mx-auto mb-4" />
          <p className="text-sm text-[#71717a]">No active clients to write notes for</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/clients">Go to Clients</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {activeClients.map(tc => (
            <ClientNoteSection key={tc.id} tc={tc as TrainerClient} />
          ))}
        </div>
      )}
    </div>
  )
}
