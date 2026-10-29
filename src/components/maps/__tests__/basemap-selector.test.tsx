// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { BasemapSelector } from '../basemap-selector'

describe('BasemapSelector', () => {
  it('renders short basemap buttons and triggers change on click', () => {
    const onBasemapChange = vi.fn()
    const { container } = render(
      <BasemapSelector activeBasemap="liberty" onBasemapChange={onBasemapChange} page="wetlands" />,
    )

    const desktopBar = container.querySelector('.sm\\:inline-flex')!
    const liteButton = within(desktopBar as HTMLElement).getByRole('button', { name: /^lite$/i })
    fireEvent.click(liteButton)
    expect(onBasemapChange).toHaveBeenCalledWith('lite')
  })

  it('renders all 5 wetland basemap buttons without a more button', () => {
    const onBasemapChange = vi.fn()
    const { container } = render(
      <BasemapSelector activeBasemap="liberty" onBasemapChange={onBasemapChange} page="wetlands" />,
    )

    const desktopBar = container.querySelector('.sm\\:inline-flex')!
    const desktopQueries = within(desktopBar as HTMLElement)

    expect(desktopQueries.getByRole('button', { name: /^streets$/i })).toBeDefined()
    expect(desktopQueries.getByRole('button', { name: /^satellite$/i })).toBeDefined()
    expect(desktopQueries.getByRole('button', { name: /^lite$/i })).toBeDefined()
    expect(desktopQueries.getByRole('button', { name: /^terrain$/i })).toBeDefined()
    expect(desktopQueries.getByRole('button', { name: /^hybrid$/i })).toBeDefined()
    expect(desktopQueries.queryByRole('combobox', { name: /more/i })).toBeNull()
  })

  it('renders more dropdown when long styles exist', () => {
    const onBasemapChange = vi.fn()
    const { container } = render(
      <BasemapSelector activeBasemap="liberty" onBasemapChange={onBasemapChange} page="carbonstorage" />,
    )

    const desktopBar = container.querySelector('.sm\\:inline-flex')!
    const moreCombobox = within(desktopBar as HTMLElement).getByRole('combobox')
    expect(moreCombobox).toBeDefined()
  })
})
