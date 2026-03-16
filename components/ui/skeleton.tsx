import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'relative overflow-hidden rounded-md bg-muted/80',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_ease-in-out_infinite]',
        'before:bg-gradient-to-r before:from-transparent before:via-background/70 before:to-transparent',
        'after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_65%)] dark:after:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_65%)]',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
