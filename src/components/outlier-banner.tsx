import { Button } from './ui/button'

interface OutlierBannerProps {
  outlierCount: number
  showOutliers: boolean
  onToggle: () => void
}

export default function OutlierBanner({ outlierCount, showOutliers, onToggle }: OutlierBannerProps) {
  if (outlierCount === 0) return null

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 flex items-center justify-between">
      <span className="text-sm text-amber-800 dark:text-amber-400">
        {outlierCount} outlier{outlierCount !== 1 ? 's' : ''} detected (z-score &gt; 3) —{' '}
        {showOutliers ? 'showing all data' : 'hidden from visualizations'}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="text-xs border-amber-500/50 hover:bg-amber-500/20"
      >
        {showOutliers ? 'Hide outliers' : 'Show outliers'}
      </Button>
    </div>
  )
}
