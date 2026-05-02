'use client'

import { AddClientDialog } from '@/components/clients/add-client-dialog'

export default function NewClientPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-xl font-semibold text-text-primary mb-4">Add a New Client</h1>
      <p className="text-sm text-text-tertiary mb-6 text-center">
        Create a new client profile and link them to your training roster.
      </p>
      <AddClientDialog />
    </div>
  )
}
