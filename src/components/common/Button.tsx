import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline'
type ButtonSize = 'lg' | 'md'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  /** 가로로 꽉 채우기 (화면 하단 버튼 등) */
  fullWidth?: boolean
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-primary text-text-inverse',
  secondary: 'bg-brand-weak text-brand-strong',
  tertiary: 'bg-surface-sunken text-text-primary',
  outline: 'border border-line-strong bg-surface-default text-text-primary',
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  lg: 'h-14 rounded-[14px] px-5 text-body1 font-bold',
  md: 'h-10 rounded-[10px] px-3.5 text-label1 font-semibold',
}

export default function Button({
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap transition-[filter,opacity]',
        // 눌림·비활성은 피그마에 없어서 임시 처리. 디자인 나오면 교체
        'active:brightness-95 disabled:pointer-events-none disabled:opacity-40',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  )
}
