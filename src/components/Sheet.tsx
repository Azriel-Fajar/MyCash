import type { ReactNode } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

/** Bottom drawer with a scrollable body and a pinned footer — used for every form. */
export function Sheet({ open, onOpenChange, title, description, children, footer }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent className="mx-auto max-h-[92dvh] max-w-lg rounded-t-[1.75rem] border-none bg-background">
        <DrawerHeader className="pb-2 text-left md:text-left">
          <DrawerTitle className="num text-lg">{title}</DrawerTitle>
          <DrawerDescription className={description ? undefined : 'sr-only'}>{description ?? title}</DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-2">{children}</div>
        {footer && <DrawerFooter className="pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  )
}
