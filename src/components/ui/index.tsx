import { cn } from '@/lib/utils'
import { cloneElement, createContext, forwardRef, isValidElement, useContext, useState, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactElement, type ReactNode, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react'

// ─── BADGE ────────────────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info'
interface BadgeProps { variant?: BadgeVariant; className?: string; children: React.ReactNode }
export function Badge({ variant = 'default', className, children }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-muted text-muted-foreground border-border',
    outline: 'border-border text-foreground bg-transparent',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    warning: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    info: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', variants[variant], className)}>
      {children}
    </span>
  )
}

// ─── BUTTON ───────────────────────────────────────────────────────────────
type BtnVariant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary'
type BtnSize = 'sm' | 'md' | 'lg' | 'icon'
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant; size?: BtnSize; loading?: boolean; asChild?: boolean
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    const variants: Record<BtnVariant, string> = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
      outline: 'border border-border bg-transparent hover:bg-muted text-foreground',
      ghost: 'bg-transparent hover:bg-muted text-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    }
    const sizes: Record<BtnSize, string> = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-4 text-sm gap-2',
      lg: 'h-11 px-6 text-base gap-2',
      icon: 'h-9 w-9 p-0',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant], sizes[size], className
        )}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ─── INPUT ────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> { error?: string; icon?: React.ReactNode }
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, ...props }, ref) => (
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all',
          icon && 'pl-9',
          error && 'border-destructive focus:ring-destructive/30',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'

// ─── TEXTAREA ─────────────────────────────────────────────────────────────
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }>(
  ({ className, error, ...props }, ref) => (
    <div>
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none',
          error && 'border-destructive',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

// ─── SELECT ───────────────────────────────────────────────────────────────
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { error?: string }>(
  ({ className, error, children, ...props }, ref) => (
    <div>
      <select
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all',
          error && 'border-destructive',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'

// ─── CARD ─────────────────────────────────────────────────────────────────
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-xl border border-border bg-card text-card-foreground shadow-sm', className)} {...props}>
      {children}
    </div>
  )
}
export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 p-5 pb-3', className)} {...props}>{children}</div>
}
export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-display font-semibold text-base text-foreground', className)} {...props}>{children}</h3>
}
export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props}>{children}</p>
}
export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-0', className)} {...props}>{children}</div>
}
export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-5 pt-0', className)} {...props}>{children}</div>
}

// ─── MODAL ────────────────────────────────────────────────────────────────
interface ModalProps { open: boolean; onClose: () => void; title?: string; description?: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }
export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full rounded-2xl border border-border bg-card shadow-2xl animate-fade-in max-h-[calc(100vh-2rem)] flex flex-col', sizes[size])}>
        {(title || description) && (
          <div className="p-6 pb-4 border-b border-border shrink-0">
            {title && <h2 className="font-display font-semibold text-lg text-foreground">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
        )}
        <div className="p-6 pt-2 overflow-y-auto custom-scrollbar flex-1">{children}</div>
      </div>
    </div>
  )
}

// ─── TABLE ────────────────────────────────────────────────────────────────
export function Table({ className, children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto">
      <table className={cn('w-full text-sm', className)} {...props}>{children}</table>
    </div>
  )
}
export function Thead({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('border-b border-border', className)} {...props}>{children}</thead>
}
export function Tbody({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-border', className)} {...props}>{children}</tbody>
}
export function Th({ className, children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider', className)} {...props}>{children}</th>
}
export function Td({ className, children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 text-sm text-foreground', className)} {...props}>{children}</td>
}
export function Tr({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('hover:bg-muted/40 transition-colors', className)} {...props}>{children}</tr>
}

// ─── SPINNER ──────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return <div className={cn('rounded-full border-2 border-primary border-t-transparent animate-spin', sizes[size])} />
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <p className="font-display font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── PAGE HEADER ──────────────────────────────────────────────────────────
export function PageHeader({ title, description, action }: {
  title: string; description?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// ─── SKELETON ─────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} />
}

// ─── LABEL ────────────────────────────────────────────────────────────────
export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('block text-sm font-medium text-foreground mb-1', className)} {...props}>
      {children}
    </label>
  )
}

// ─── SWITCH ───────────────────────────────────────────────────────────────
interface SwitchProps {
  checked: boolean
  onChange?: (v: boolean) => void
  onCheckedChange?: (v: boolean) => void
  disabled?: boolean
  id?: string
}
export function Switch({ checked, onChange, onCheckedChange, disabled, id }: SwitchProps) {
  const handleChange = () => {
    const next = !checked
    onChange?.(next)
    onCheckedChange?.(next)
  }

  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleChange}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-muted'
      )}
    >
      <span className={cn(
        'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
        checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
      )} />
    </button>
  )
}

// ─── DROPDOWN MENU ───────────────────────────────────────────────────────
interface DropdownMenuContextValue {
  open: boolean
  toggle: () => void
  close: () => void
}
const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null)

interface DropdownMenuProps { children: ReactNode }
export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)

  const toggle = () => setOpen((prev) => !prev)
  const close = () => setOpen(false)

  return (
    <DropdownMenuContext.Provider value={{ open, toggle, close }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children: ReactNode
}
export function DropdownMenuTrigger({ asChild, children, ...props }: DropdownMenuTriggerProps) {
  const context = useContext(DropdownMenuContext)
  if (!context) return null

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    context.toggle()
  }

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      ...children.props,
      ...props,
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
        children.props.onClick?.(event)
        handleClick(event)
      },
    } as ReactElement)
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end'
  children: ReactNode
}
export function DropdownMenuContent({ align = 'start', className, children, ...props }: DropdownMenuContentProps) {
  const context = useContext(DropdownMenuContext)
  if (!context?.open) return null

  return (
    <div
      className={cn(
        'absolute z-50 mt-2 min-w-[10rem] rounded-xl border border-border bg-card shadow-xl py-1',
        align === 'end' ? 'right-0' : 'left-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}
export function DropdownMenuItem({ className, onClick, children, ...props }: DropdownMenuItemProps) {
  const context = useContext(DropdownMenuContext)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    context?.close()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn('flex w-full items-center gap-2 px-3 py-2 text-sm text-left text-foreground transition-colors hover:bg-muted', className)}
      {...props}
    >
      {children}
    </button>
  )
}

// ─── DIALOG ───────────────────────────────────────────────────────────────
interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}
const DialogContext = createContext<DialogContextValue | null>(null)

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}
export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>
}

interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}
export function DialogContent({ className, children, ...props }: DialogContentProps) {
  const context = useContext(DialogContext)
  if (!context?.open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => context.onOpenChange(false)} />
      <div className={cn('relative w-full max-w-3xl overflow-hidden rounded-2xl bg-card shadow-2xl', className)} {...props}>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 pt-6 pb-4 border-b', className)} {...props}>
      {children}
    </div>
  )
}

export function DialogTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('font-display font-semibold text-lg text-foreground', className)} {...props}>
      {children}
    </h2>
  )
}

export function DialogDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('mt-1 text-sm text-muted-foreground', className)} {...props}>
      {children}
    </p>
  )
}

export function DialogFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-end gap-3 p-4 border-t', className)} {...props}>
      {children}
    </div>
  )
}

// ─── TABLE HELPERS ──────────────────────────────────────────────────────────
export function TableHeader({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('border-b border-border', className)} {...props}>
      {children}
    </thead>
  )
}

export function TableBody({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('divide-y divide-border', className)} {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('hover:bg-muted/40 transition-colors', className)} {...props}>
      {children}
    </tr>
  )
}

export function TableHead({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn('px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider', className)} {...props}>
      {children}
    </th>
  )
}

export function TableCell({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 text-sm text-foreground', className)} {...props}>
      {children}
    </td>
  )
}

// ─── TABS ─────────────────────────────────────────────────────────────────
interface TabsProps { tabs: { label: string; value: string; count?: number }[]; value: string; onChange: (v: string) => void }
export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            value === tab.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded-full font-medium',
              value === tab.value ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/20 text-muted-foreground'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
