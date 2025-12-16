import { useEffect, useState, RefObject } from 'react'

/**
 * Hook to track container width changes for responsive D3 charts
 * Uses ResizeObserver for efficient resize detection
 */
export function useContainerWidth(containerRef: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })

    resizeObserver.observe(containerRef.current)
    setWidth(containerRef.current.offsetWidth)

    return () => resizeObserver.disconnect()
  }, [containerRef])

  return width
}
