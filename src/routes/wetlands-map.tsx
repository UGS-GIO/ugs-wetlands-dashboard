import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/wetlands-map')({
  component: WetlandsMapPage,
})

function WetlandsMapPage() {
  return (
    <iframe
      src="https://maps.geology.utah.gov/wetlandplants"
      title="Utah Wetlands Map"
      className="w-full h-full border-0 block"
      allow="geolocation"
    />
  )
}
