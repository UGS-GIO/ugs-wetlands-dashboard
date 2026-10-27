import { useCallback, useState } from 'react'

/**
 * Hook to track container width changes for responsive D3 charts
 * Returns a callback ref that attaches a ResizeObserver to whichever element it lands on
 */
export function useContainerWidth<T extends HTMLElement>(): [(node: T | null) => () => void, number] {
  const [width, setWidth] = useState(0)

  const containerRef = useCallback((node: T | null) => {
    if (!node) return () => {}

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })

    resizeObserver.observe(node)
    setWidth(node.offsetWidth)

    return () => resizeObserver.disconnect()
  }, [])

  return [containerRef, width]
}
