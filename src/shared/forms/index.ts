/**
 * Shared form components — all wired to react-hook-form Controller.
 *
 * Usage pattern (zod schema + RHF):
 *
 *   import { z } from 'zod'
 *   import { zodResolver } from '@hookform/resolvers/zod'
 *   import { useForm } from 'react-hook-form'
 *   import { FormInput, FormSelect, FormTextarea } from '@/shared/forms'
 *
 *   const schema = z.object({ name: z.string().min(2), role: z.string() })
 *   type FormValues = z.infer<typeof schema>
 *
 *   const form = useForm<FormValues>({
 *     resolver: zodResolver(schema),
 *     mode: 'onChange',
 *     reValidateMode: 'onChange',
 *   })
 *
 *   <FormInput name="name" control={form.control} label="Name" required />
 *   <FormSelect name="role" control={form.control} label="Role" options={[...]} />
 */

export { FormInput } from './FormInput'
export { FormTextarea } from './FormTextarea'
export { FormSelect } from './FormSelect'
export { FormCheckbox } from './FormCheckbox'
export { FormCombobox } from './FormCombobox'
export { FormFieldWrapper } from './FormFieldWrapper'
