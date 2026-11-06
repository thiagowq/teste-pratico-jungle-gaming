import { useState } from 'react'
import { EyeOffIcon } from '@/components/icons'
import { inputClass } from '@/lib/input-class'
import { cn } from '@/lib/utils'

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="mt-1.5 text-[13px] leading-4 text-coral">
      {message}
    </p>
  )
}

interface PasswordInputProps extends Omit<React.ComponentProps<'input'>, 'size' | 'type'> {
  size?: 'md' | 'lg'
}

/** Campo de senha com botão de mostrar/ocultar (ícone "Hide" do Figma). */
export function PasswordInput({ size = 'md', className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className={cn(inputClass(size), 'pr-12', className)} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
        aria-controls={props.id}
        className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-sm hover:bg-surface-raised"
      >
        <EyeOffIcon aria-hidden className={cn('h-5 w-[23px]', visible && 'opacity-50')} />
      </button>
    </div>
  )
}
