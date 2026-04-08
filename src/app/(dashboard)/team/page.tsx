'use client'

import { useState } from 'react'
import { UserPlus, Users, Mail, ArrowRight, Check, Loader2, Link2, MessageCircle } from 'lucide-react'
import { useOrganizationTrainers, useOrganizationClients, useInvitations, useSendInvite, useAssignTrainerToClient, useTrainerAssignments } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, UserAvatar, Skeleton, Badge } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { Input, FormField } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

function InviteDialog({ role }: { role: 'trainer' | 'client' }) {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const sendInvite = useSendInvite()

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    const result = await sendInvite.mutateAsync({ email, role })
    if (result.token) {
      setInviteUrl(`${window.location.origin}/invite?token=${result.token}`)
      setSuccess(true)
    }
  }

  if (success && inviteUrl) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">Invitation sent!</span>
        </div>
        <div className="p-3 bg-surface-2 rounded-lg border border-border-subtle">
          <p className="text-xs text-text-muted mb-1.5">Share this invite link:</p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-text-secondary flex-1 truncate">{inviteUrl}</code>
            <button
              onClick={() => navigator.clipboard.writeText(inviteUrl)}
              className="text-indigo-400 hover:text-indigo-300 p-1"
              title="Copy"
            >
              <Link2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={() => { setSuccess(false); setEmail(''); setInviteUrl(null) }}>
          Invite another
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleInvite} className="space-y-4">
      <FormField label="Email address">
        <Input
          type="email"
          placeholder={`Enter ${role}'s email`}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </FormField>
      <Button type="submit" className="w-full" loading={sendInvite.isPending}>
        {!sendInvite.isPending && <><Mail className="h-4 w-4" /><span>Send Invite</span></>}
        {sendInvite.isPending && 'Sending…'}
      </Button>
      {sendInvite.error && (
        <p className="text-xs text-red-400">{(sendInvite.error as Error).message}</p>
      )}
    </form>
  )
}

export default function TeamPage() {
  const { data: trainers, isLoading: trainersLoading } = useOrganizationTrainers()
  const { data: clients, isLoading: clientsLoading } = useOrganizationClients()
  const { data: invitations } = useInvitations()
  const { data: assignments } = useTrainerAssignments()
  const assignMutation = useAssignTrainerToClient()
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)

  const pendingInvites = invitations?.filter(i => !i.accepted_at) ?? []

  async function handleAssign() {
    if (!selectedTrainer || !selectedClient) return
    await assignMutation.mutateAsync({ trainer_id: selectedTrainer, client_id: selectedClient })
    setSelectedTrainer(null)
    setSelectedClient(null)
  }

  // Build a map of existing assignments
  const assignmentMap = new Map<string, string[]>()
  assignments?.forEach(a => {
    const existing = assignmentMap.get(a.trainer_id) || []
    existing.push(a.client_id)
    assignmentMap.set(a.trainer_id, existing)
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Team Management"
        description="Invite trainers and clients, then assign them to each other"
        actions={
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><UserPlus className="h-3.5 w-3.5" />Invite Trainer</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Invite a Trainer</DialogTitle></DialogHeader>
                <InviteDialog role="trainer" />
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm"><UserPlus className="h-3.5 w-3.5" />Invite Client</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Invite a Client</DialogTitle></DialogHeader>
                <InviteDialog role="client" />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Trainers */}
        <Card>
          <CardHeader>
            <CardTitle>Trainers</CardTitle>
            <CardDescription>{trainers?.length ?? 0} in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            {trainersLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !trainers?.length ? (
              <div className="text-center py-8 text-text-muted">
                <Users className="h-8 w-8 mx-auto mb-2 text-border" />
                <p className="text-sm">No trainers yet. Invite your first trainer above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {trainers.map(t => {
                  const assignedCount = assignmentMap.get(t.id)?.length ?? 0
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTrainer(t.id)}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        selectedTrainer === t.id
                          ? 'border-indigo-500 bg-indigo-600/10'
                          : 'border-border-subtle hover:border-border hover:bg-surface-2'
                      }`}
                    >
                      <UserAvatar name={t.full_name} src={t.avatar_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{t.full_name}</p>
                        <p className="text-xs text-text-muted truncate">{t.email}</p>
                      </div>
                      <span className="text-xs text-text-faint">{assignedCount} clients</span>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
            <CardDescription>{clients?.length ?? 0} in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            {clientsLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !clients?.length ? (
              <div className="text-center py-8 text-text-muted">
                <Users className="h-8 w-8 mx-auto mb-2 text-border" />
                <p className="text-sm">No clients yet. Invite your first client above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {clients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClient(c.id)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      selectedClient === c.id
                        ? 'border-indigo-500 bg-indigo-600/10'
                        : 'border-border-subtle hover:border-border hover:bg-surface-2'
                    }`}
                  >
                    <UserAvatar name={c.full_name} src={c.avatar_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{c.full_name}</p>
                      <p className="text-xs text-text-muted truncate">{c.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assignment Action */}
      {(selectedTrainer || selectedClient) && (
        <Card className="border-indigo-500/30 bg-indigo-600/5">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-sm text-text-secondary">
                  {selectedTrainer && selectedClient ? (
                    <span>
                      Assign <strong className="text-text-primary">{clients?.find(c => c.id === selectedClient)?.full_name}</strong>
                      {' → '}
                      <strong className="text-text-primary">{trainers?.find(t => t.id === selectedTrainer)?.full_name}</strong>
                    </span>
                  ) : (
                    <span className="text-text-muted">Select a trainer and a client to create an assignment</span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                disabled={!selectedTrainer || !selectedClient}
                loading={assignMutation.isPending}
                onClick={handleAssign}
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Assign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>{pendingInvites.length} awaiting acceptance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingInvites.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle bg-surface-2 group">
                  <Mail className="h-4 w-4 text-text-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{inv.email}</p>
                    <p className="text-xs text-text-muted capitalize">{inv.role}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 border-emerald-600/20 hover:bg-emerald-600/10 mr-2 hidden sm:flex items-center gap-1.5"
                    onClick={() => {
                      const url = `${window.location.origin}/invite?token=${inv.token}`
                      const text = encodeURIComponent(`Join me on Precision Health! Here is your private invite link: ${url}`)
                      window.open(`https://wa.me/?text=${text}`, '_blank')
                    }}
                    title="Share via WhatsApp"
                  >
                    <MessageCircle className="h-3 w-3" />
                    WhatsApp
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-text-secondary mr-2 hidden sm:flex items-center gap-1.5"
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invite?token=${inv.token}`)}
                    title="Copy Invite Link"
                  >
                    <Link2 className="h-3 w-3" />
                    Copy Link
                  </Button>
                  
                  {/* Mobile versions */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 text-emerald-600 sm:hidden mr-1"
                    onClick={() => {
                      const url = `${window.location.origin}/invite?token=${inv.token}`
                      const text = encodeURIComponent(`Join me on Precision Health! Here is your private invite link: ${url}`)
                      window.open(`https://wa.me/?text=${text}`, '_blank')
                    }}
                    title="Share via WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 text-text-secondary sm:hidden"
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invite?token=${inv.token}`)}
                    title="Copy Invite Link"
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Pending</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
