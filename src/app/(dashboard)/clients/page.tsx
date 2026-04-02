'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Users, ArrowRight, MoreHorizontal } from 'lucide-react'
import { useClients, useUpdateClientStatus } from '@/hooks/use-data'
import { Card, CardContent, UserAvatar, Skeleton } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/page-header'
import { AddClientDialog } from '@/components/clients/add-client-dialog'
import { STATUS_COLORS, formatDate } from '@/lib/utils'
import type { ClientStatus } from '@/types/database'

const STATUS_TABS: { label: string; value: ClientStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Archived', value: 'archived' },
]

export default function ClientsPage() {
  const { data: clients, isLoading } = useClients()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all')

  const filtered = clients?.filter(tc => {
    const matchesSearch = !search ||
      tc.client?.full_name.toLowerCase().includes(search.toLowerCase()) ||
      tc.client?.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tc.status === statusFilter
    return matchesSearch && matchesStatus
  }) ?? []

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Clients"
        description={`${clients?.length ?? 0} total clients`}
        actions={<AddClientDialog />}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#52525b]" />
          <Input
            placeholder="Search clients…"
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 p-1 bg-[#111113] border border-[#27272a] rounded-lg">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-[#1a1a1f] text-[#fafafa] border border-[#27272a]'
                  : 'text-[#71717a] hover:text-[#a1a1aa]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Client Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-5"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-10 w-10 text-[#27272a] mx-auto mb-4" />
          <p className="text-sm font-medium text-[#71717a]">
            {search ? 'No clients match your search' : 'No clients yet'}
          </p>
          {!search && (
            <p className="text-xs text-[#52525b] mt-1 mb-4">Add your first client to get started</p>
          )}
          {!search && <AddClientDialog />}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tc) => (
            <Link key={tc.id} href={`/clients/${tc.client_id}`}>
              <Card className="hover:border-[#3f3f46] transition-colors cursor-pointer group">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-4">
                    <UserAvatar name={tc.client?.full_name ?? 'Client'} src={tc.client?.avatar_url} size="md" />
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[tc.status]}`}>
                      {tc.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#fafafa] truncate">{tc.client?.full_name}</p>
                  <p className="text-xs text-[#52525b] truncate mt-0.5">{tc.client?.email}</p>
                  {tc.goal_summary && (
                    <p className="text-xs text-[#71717a] mt-2 line-clamp-2 leading-relaxed">{tc.goal_summary}</p>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1a1a1f]">
                    <span className="text-[10px] text-[#3f3f46]">Since {formatDate(tc.onboarding_date)}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#3f3f46] group-hover:text-indigo-400 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
