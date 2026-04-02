'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-data'
import { profileSchema, type ProfileInput } from '@/lib/validations'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, UserAvatar } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea, FormField } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/page-header'
import { useQueryClient } from '@tanstack/react-query'
import { KEYS } from '@/hooks/use-data'

const COMMON_CERTS = ['NASM-CPT', 'ACE-CPT', 'NSCA-CSCS', 'CrossFit L1', 'CrossFit L2', 'ISSA-CPT', 'ACSM-CPT']
const COMMON_SPECS = ['Weight Loss', 'Muscle Gain', 'Strength Training', 'Cardio & Endurance', 'HIIT', 'Nutrition', 'Sports Performance', 'Rehabilitation', 'Flexibility & Mobility']

export default function SettingsPage() {
  const { data: profile, isLoading } = useProfile()
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [certs, setCerts] = useState<string[]>([])
  const [specs, setSpecs] = useState<string[]>([])
  const [newCert, setNewCert] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema) as never,
  })

  // Populate form once profile loads — wrapped in setTimeout to avoid
  // synchronous setState-in-effect lint error (react-compiler rule)
  useEffect(() => {
    if (!profile) return
    const timer = setTimeout(() => {
      reset({
        full_name: profile.full_name,
        bio: profile.bio ?? '',
        phone: profile.phone ?? '',
        years_experience: profile.years_experience ?? undefined,
      })
      setCerts(profile.certifications ?? [])
      setSpecs(profile.specializations ?? [])
    }, 0)
    return () => clearTimeout(timer)
  }, [profile, reset])

  async function onSubmit(data: ProfileInput) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        bio: data.bio,
        phone: data.phone,
        years_experience: data.years_experience,
        certifications: certs,
        specializations: specs,
      })
      .eq('id', profile!.id)

    if (error) { setServerError(error.message); return }
    await qc.invalidateQueries({ queryKey: KEYS.profile })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const toggleSpec = (spec: string) => {
    setSpecs(prev => prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec])
  }

  const addCert = () => {
    if (newCert.trim() && !certs.includes(newCert.trim())) {
      setCerts(prev => [...prev, newCert.trim()])
      setNewCert('')
    }
  }

  if (isLoading) return (
    <div className="p-8 max-w-2xl mx-auto animate-pulse space-y-4">
      <div className="h-6 bg-[#1a1a1f] rounded w-32" />
      <div className="h-48 bg-[#1a1a1f] rounded-xl" />
    </div>
  )

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <PageHeader title="Settings" description="Manage your trainer profile" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Profile card */}
        <Card>
          <CardHeader>
            <CardTitle>Trainer Profile</CardTitle>
            <CardDescription>Your public-facing information shown to clients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar section */}
            <div className="flex items-center gap-4 pb-4 border-b border-[#1a1a1f]">
              <UserAvatar name={profile?.full_name ?? 'T'} src={profile?.avatar_url} size="lg" />
              <div>
                <p className="text-sm font-medium text-[#fafafa]">{profile?.full_name}</p>
                <p className="text-xs text-[#52525b]">{profile?.email}</p>
                <p className="text-xs text-[#3f3f46] mt-1 capitalize">{profile?.role}</p>
              </div>
            </div>

            <FormField label="Full Name" error={errors.full_name?.message}>
              <Input {...register('full_name')} />
            </FormField>

            <FormField label="Phone">
              <Input type="tel" placeholder="+1 555 000 0000" {...register('phone')} />
            </FormField>

            <FormField label="Years of Experience">
              <Input type="number" min="0" max="50" placeholder="5" {...register('years_experience')} />
            </FormField>

            <FormField label="Bio" hint="Tell clients about your coaching style and background">
              <Textarea
                placeholder="I specialize in helping busy professionals build sustainable fitness habits…"
                rows={4}
                {...register('bio')}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Certifications card */}
        <Card>
          <CardHeader>
            <CardTitle>Certifications</CardTitle>
            <CardDescription>Add your professional certifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {COMMON_CERTS.map(cert => (
                <button
                  key={cert}
                  type="button"
                  onClick={() => setCerts(prev => prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert])}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    certs.includes(cert)
                      ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40'
                      : 'bg-transparent text-[#71717a] border-[#27272a] hover:border-[#3f3f46]'
                  }`}
                >
                  {certs.includes(cert) && <Check className="inline h-2.5 w-2.5 mr-1" />}
                  {cert}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Add custom certification…"
                value={newCert}
                onChange={e => setNewCert(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCert() } }}
                className="h-8 text-xs"
              />
              <Button type="button" size="sm" variant="outline" onClick={addCert} className="h-8 px-3">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {certs.filter(c => !COMMON_CERTS.includes(c)).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {certs.filter(c => !COMMON_CERTS.includes(c)).map(cert => (
                  <span key={cert} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-indigo-600/15 text-indigo-400 border border-indigo-500/30">
                    {cert}
                    <button type="button" onClick={() => setCerts(prev => prev.filter(c => c !== cert))}>
                      <X className="h-3 w-3 hover:text-white transition-colors" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Specializations card */}
        <Card>
          <CardHeader>
            <CardTitle>Specializations</CardTitle>
            <CardDescription>What areas do you coach in?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {COMMON_SPECS.map(spec => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpec(spec)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    specs.includes(spec)
                      ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40'
                      : 'bg-transparent text-[#71717a] border-[#27272a] hover:border-[#3f3f46]'
                  }`}
                >
                  {specs.includes(spec) && <Check className="inline h-2.5 w-2.5 mr-1" />}
                  {spec}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {serverError && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5">
            <p className="text-sm text-red-400">{serverError}</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-400">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
          <Button type="submit" loading={isSubmitting} disabled={!isDirty && !saved}>
            {!isSubmitting && (saved ? <><Check className="h-3.5 w-3.5" />Saved!</> : 'Save Changes')}
          </Button>
        </div>
      </form>
    </div>
  )
}
