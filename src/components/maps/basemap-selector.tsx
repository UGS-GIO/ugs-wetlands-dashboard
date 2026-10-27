import { useMemo } from 'react'
import { Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { resolveAppBasemaps, type BasemapStyle } from '@/lib/basemaps'

interface BasemapSelectorProps {
  activeBasemap: string
  onBasemapChange: (basemapId: string) => void
  page?: string
  className?: string
}

function getDisplayTitle(style: BasemapStyle): string {
  if (style.id === 'satellite') return 'Satellite (Utah)'
  return style.title
}

export function BasemapSelector({
  activeBasemap,
  onBasemapChange,
  page = 'wetlands',
  className,
}: BasemapSelectorProps) {
  const { styles } = useMemo(() => resolveAppBasemaps(page), [page])

  const shortStyles = useMemo(() => styles.filter((s) => s.type === 'short'), [styles])
  const longStyles = useMemo(() => styles.filter((s) => s.type === 'long'), [styles])

  const activeStyle = styles.find((s) => s.id === activeBasemap)
  const isLongActive = longStyles.some((s) => s.id === activeBasemap)
  const longTitle = isLongActive && activeStyle ? getDisplayTitle(activeStyle) : 'More'

  return (
    <div className={cn('flex items-center', className)}>
      {/* Desktop / tablet button bar + More dropdown */}
      <div className="hidden sm:inline-flex items-center bg-card/95 backdrop-blur-xs text-card-foreground rounded-lg shadow-md border border-border p-0.5 text-xs font-medium">
        {shortStyles.map((style) => {
          const isActive = activeBasemap === style.id
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onBasemapChange(style.id)}
              className={cn(
                'px-2.5 py-1.5 rounded-md transition-colors cursor-pointer',
                isActive
                  ? 'bg-primary text-black font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
              )}
            >
              {getDisplayTitle(style)}
            </button>
          )
        })}

        {longStyles.length > 0 && (
          <Select
            value={isLongActive ? activeBasemap : ''}
            onValueChange={(val) => val && onBasemapChange(val)}
          >
            <SelectTrigger
              size="sm"
              className={cn(
                'h-7 px-2 border-0 shadow-none text-xs rounded-md cursor-pointer data-[size=sm]:h-7',
                isLongActive
                  ? 'bg-primary text-black font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
              )}
            >
              <span>{longTitle}</span>
            </SelectTrigger>
            <SelectContent align="start">
              {longStyles.map((style) => (
                <SelectItem key={style.id} value={style.id}>
                  {getDisplayTitle(style)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Mobile single dropdown */}
      <div className="sm:hidden">
        <Select value={activeBasemap} onValueChange={(val) => val && onBasemapChange(val)}>
          <SelectTrigger
            size="sm"
            className="h-8 bg-card/95 backdrop-blur-xs text-xs font-medium border border-border shadow-md px-2.5 cursor-pointer"
          >
            <Layers className="size-3.5 mr-1 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              <SelectLabel>Standard</SelectLabel>
              {shortStyles.map((style) => (
                <SelectItem key={style.id} value={style.id}>
                  {getDisplayTitle(style)}
                </SelectItem>
              ))}
            </SelectGroup>
            {longStyles.length > 0 && (
              <>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Utah / Aerial</SelectLabel>
                  {longStyles.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      {getDisplayTitle(style)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default BasemapSelector
