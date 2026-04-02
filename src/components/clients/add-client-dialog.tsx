'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus } from 'lucide-react'
import { useAddClient } from '@/hooks/use-data'
import { clientSchema, type ClientInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input, Textarea, FormField, Select } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
} from '@/components/ui/dialog'

interface AddClientDialogProps {
  trigger?: React.ReactNode
  onSuccess?: (clientId: string) => void
}

export function AddClientDialog({ trigger, onSuccess }: AddClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const addClient = useAddClient()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema) as never,
  })

  async function onSubmit(data: ClientInput) {
    setServerError(null)
    try {
      const clientId = await addClient.mutateAsync({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        height_cm: data.height_cm,
        goal_summary: data.goal_summary,
      })
      reset()
      setOpen(false)
      onSuccess?.(clientId)
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : 'Failed to add client')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <UserPlus className="h-3.5 w-3.5" />
            Add Client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>Create a client profile and link them to your account.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Full Name *" error={errors.full_name?.message} className="col-span-2">
              <Input placeholder="Jane Smith" {...register('full_name')} />
            </FormField>
            <FormField label="Email *" error={errors.email?.message} className="col-span-2">
              <Input type="email" placeholder="client@email.com" {...register('email')} />
            </FormField>
            <FormField label="Phone" error={errors.phone?.message}>
              <Input placeholder="+1 555 000 0000" {...register('phone')} />
            </FormField>
            <FormField label="Date of Birth">
              <Input type="date" {...register('date_of_birth')} />
            </FormField>
            <FormField label="Gender">
              <Select {...register('gender')} placeholder="Select gender">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </Select>
            </FormField>
            <FormField label="Height (cm)" error={errors.height_cm?.message}>
              <Input type="number" placeholder="175" {...register('height_cm')} />
            </FormField>
          </div>

          <FormField label="Goal Summary" error={errors.goal_summary?.message} hint="Quick description of what this client wants to achieve">
            <Textarea placeholder="e.g. Lose 10kg by summer, improve cardiovascular fitness…" rows={3} {...register('goal_summary')} />
          </FormField>

          {serverError && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5">
              <p className="text-sm text-red-400">{serverError}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false) }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || addClient.isPending}>Add Client</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
