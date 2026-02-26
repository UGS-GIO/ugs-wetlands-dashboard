import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { fetchCount, fetchUniqueCount } from '../utils/api'

export const Route = createFileRoute('/')({
  component: Home,
})

interface DataCounts {
  water: number
  soil: number
  inverts: number
}

function Home() {
  const [counts, setCounts] = useState<DataCounts>({ water: 0, soil: 0, inverts: 0 })

  useEffect(() => {
    const loadCounts = async () => {
      try {
        // Use lightweight count queries instead of fetching all data
        const [waterCount, soilCount, invertsCount] = await Promise.all([
          fetchCount('water'),
          fetchCount('soil'),
          fetchUniqueCount('inverts', 'siteid'),
        ])

        setCounts({
          water: waterCount,
          soil: soilCount,
          inverts: invertsCount,
        })
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadCounts()
  }, [])

  return (
    <div className="px-4 md:px-8 pt-2">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-2xl font-bold mb-4">Welcome to the Utah Wetland Data Explorer!</h2>

          <p className="text-base mb-4">
            Explore water quality, soil chemistry, and macroinvertebrate communities in Utah's wetlands!
          </p>

          <p className="text-base mb-4">
            Utah is home to 1.5 million acres of wetlands. Wetlands are land that has: 1) water at or near the soil surface for some part of the year, 2) hydric soils
            with low oxygen created by flooding, and 3) hydrophytic plants, which are adapted to grow in water or saturated, low-oxygen soils. 
            Wetlands are rare in Utah, covering only three percent of the state, but they provide functions that are crucial to healthy watersheds. 
            Wetland functions include:
          </p>

          <ul className="list-disc ml-6 mb-4">
            <li>Improving water quality,</li>
            <li>Buffering communities from drought and flood,</li>
            <li>Providing habitat for 80% of Utah's fish and wildlife species, and</li>
            <li>Providing recreation opportunities for paddling, wildlife watching, hunting, and fishing.</li>
          </ul>

          <p>
            Wetland hydrology is dynamic, often switching between deep and shallow flooding or no flooding at all.
            Dynamic hydrology leads to chemical and biological conditions that set wetlands apart from other aquatic
            ecosystems like lakes and streams. Decades of research, management, and monitoring in Utah wetlands have
            produced a trove of chemical, physical, and biological data, but that data is often in disparate reports
            written by multiple sources. This web application provides data compiled from numerous sources and presents
            information to the public all in one place.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center">
          <img
            src={`${import.meta.env.BASE_URL}images/bda_strawberry.webp`}
            alt="Beaver Dam Analog and wetland near Strawberry Reservoir"
            className="w-full h-auto max-h-96 object-cover rounded-xl shadow-lg"
          />
          <p className="text-center text-muted-foreground mt-2 text-sm italic">
            Beaver Dam Analog and wetland near Strawberry Reservoir
          </p>
        </div>
      </div>

      {/* Value Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <ValueBox value={counts.water.toLocaleString()} label="Water Chemistry Records" icon="💧" href="/water-chemistry" />
        <ValueBox value={counts.soil.toLocaleString()} label="Soil Chemistry Records" icon="🌍" href="/soil-chemistry" />
        <ValueBox value={counts.inverts.toString()} label="Macroinvertebrate Samples" icon="🦐" href="/macroinvertebrates" />
      </div>

      {/* Data Sources Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center">
          <img
            src={`${import.meta.env.BASE_URL}images/uwam_crew.webp`}
            alt="UGS ecologists monitoring a wetland in Beaver County"
            className="w-full h-auto object-contain rounded-xl shadow-lg"
          />
          <p className="text-center text-muted-foreground mt-2 text-sm italic">
            UGS ecologists monitoring a wetland in Beaver County
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="mt-0 text-xl font-bold text-foreground">Data Sources</h3>

          <p className="mb-4">
            The bulk of data included here is from samples gathered as part of wetland condition monitoring surveys
            conducted by the Utah Geological Survey (UGS) and Utah Division of Water Quality. The most common way to
            measure wetland condition is to assess what types of plants are growing and how much area they cover. Water,
            soil, and macroinvertebrates provide important clues into factors that drive wetland condition and those
            samples were gathered alongside plant community monitoring. The existing data is heavily focused around Great
            Salt Lake. The UGS hopes to collate more data to paint a full picture of wetland chemistry and biology
            across Utah. To learn more about data included in this dashboard, check out the resources below:
          </p>

          <ul className="list-disc ml-6">
            <li>
              <a href="https://geology.utah.gov/water/wetlands/" target="_blank" rel="noopener" className="text-primary">
                The UGS Wetlands Program website
              </a>
            </li>
            <li>
              <a
                href="https://geodata.geology.utah.gov/pages/collections_featured.php?parent=665"
                target="_blank"
                rel="noopener"
                className="text-primary"
              >
                The Wetlands collection in the Utah GeoData Archive
              </a>
            </li>
            <li>
              <a href="https://wetlandplants.geology.utah.gov/" target="_blank" rel="noopener" className="text-primary">
                The Utah Wetland Plant Application
              </a>
            </li>
            <li>
              <a href="https://wetlands.geology.utah.gov/" target="_blank" rel="noopener" className="text-primary">
                The Utah Wetland Mapper
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Ways to Explore */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <h3 className="text-xl font-bold text-foreground">Ways to Explore the Data</h3>

        <p className="mb-4">
          The tabs at the top of this page will guide you through visualizations and summaries of water chemistry, soil
          chemistry, and macroinvertebrate communities found in Utah's wetlands. Data from multiple sources are presented
          in one place and put into a context to help visualize how the data could be used in wetland management,
          restoration, and research.
        </p>

        <ul className="ml-6">
          <li>
            <strong>Maps</strong>: Viewing data spatially can show potential regional differences in wetlands or hotspots
            where a particular parameter is notably different. Maps can highlight gradients of increasing concentration or
            diversity. A spatial view also allows users to focus on a region, management area, or particular wetland of
            interest. Points have been jittered so that repeat samples from the same location can be seen.
          </li>

          <li>
            <strong>Histograms</strong>: These charts show the range of values possible for a measurement as well as what
            values are most or least common. In histograms, the longest bars show the most common value observed in the
            data. When a value is less common, the bar will be shorter.
          </li>

          <li>
            <strong>Boxplots</strong>: These plots are a way to compare data across multiple groups. The top and bottom
            sides of each box mark the 25th and 75th percentiles of observations in that group, whereas the middle bar is
            the median or middle value. The whiskers on each plot show the maximum and minimum values, and any points
            above or below those whiskers are considered outliers.
          </li>

          <li>
            <strong>Summary statistics</strong>: These values show the details of how a parameter is different between
            wetland populations of interest for a more exact comparison.
          </li>

          <li>
            <strong>On Your Own</strong>: A 'Download' button is at the bottom of each tab, where you can download a
            subset of parameters or all the data.
          </li>
        </ul>

        <p className="mb-4">
          <strong>Populations</strong>: The dropdowns at the top of each page allow you to divide data in the plots and tables into different groups.
        </p>

        <ul className="list-disc ml-6">
          <li>
            <strong>Watersheds</strong>: The climate, topography, hydrology, and geology of a watershed determine where wetlands are located and what type of wetlands exist there. The United States is divided into <a href="https://www.arcgis.com/home/item.html?id=5bbefdcd2511472ea9abd0afedb85c7e" target="_blank" rel="noopener" className="text-primary">Hydrologic Unit Codes</a> (HUC's), with longer codes (2-12 digits) showing higher resolution of shared water sources. We are showing data in 6-digit Basin codes.
          </li>
          <li>
            <strong>Ecoregions</strong>: The U.S. is also divided into <a href="https://www.epa.gov/eco-research/ecoregions" target="_blank" rel="noopener" className="text-primary">ecoregions</a>, which are areas that support similar ecosystems because they have the same landforms, climate, biological communities, and land uses. Utah is very ecologically diverse and supports seven Level III ecoregions, from the arid Colorado Plateau to the high elevation Wasatch and Uinta Mountains.
          </li>
          <li>
            <strong>Wetland Type</strong>: Wetlands can be grouped in several ways, here we are lumping them together by their dominant vegetation type, following the classes developed by <a href="https://www.fws.gov/media/national-wetland-inventory-wetlands-and-deepwater-map-code-diagram" target="_blank" rel="noopener" className="text-primary">Cowardin</a> for the U.S. Fish and Wildlife Service.
          </li>
        </ul>
      </div>

      {/* Submission CTA */}
      <div className="mb-4 p-4 bg-card rounded-xl border border-border">
        <p>
          Please consider submitting your data to the Utah Geological Survey for inclusion in the Wetland Data Explorer.
          Contact Becka Downard at{' '}
          <a href="mailto:beckad@utah.gov" className="text-primary">
            beckad@utah.gov
          </a>{' '}
          for instructions on how to format and submit your data.
        </p>
      </div>
    </div>
  )
}

// Value Box Component
function ValueBox({ value, label, icon, href }: { value: string; label: string; icon: string; href: string }) {
  return (
    <Link
      to={href}
      className="bg-gradient-to-br from-card to-accent rounded-xl p-4 text-center border border-border block cursor-pointer hover:bg-none hover:bg-ugs-dark-alt"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-4xl font-bold text-primary">{value}</div>
      <div className="text-base text-muted-foreground mt-2">{label}</div>
    </Link>
  )
}
