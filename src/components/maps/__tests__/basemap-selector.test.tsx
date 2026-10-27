// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BasemapSelector } from '../basemap-selector'

describe('BasemapSelector', () => {
  it('renders short basemap buttons and triggers change on click', () => {
    const onBasemapChange = vi.fn()
    render(<BasemapSelector activeBasemap="liberty" onBasemapChange={onBasemapChange} />)

    const streetsButtons = screen.getAllByRole('button', { name: /streets/i })
    expect(streetsButtons.length).toBeGreaterThan(0)

    const liteButton = screen.getByRole('button', { name: /^lite$/i })
    fireEvent.click(liteButton)
    expect(onBasemapChange).toHaveBeenCalledWith('lite')
  })
})
