import { useFormContext } from 'react-hook-form'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { TryOnFormValues } from './schema'

export function ModelSelectionSection() {
  const form = useFormContext<TryOnFormValues>()

  const onModelChange = (value: string) => {
    form.setValue('model', value as TryOnFormValues['model'], {
      shouldValidate: true,
    })
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="model-select">Generation Model</Label>
      <Select onValueChange={onModelChange} value={form.watch('model')}>
        <SelectTrigger id="model-select">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="normal">Normal (Faster)</SelectItem>
          <SelectItem value="advanced">Advanced (Higher Quality)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
