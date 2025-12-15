import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'

interface DisclaimerModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
}

export default function DisclaimerModal({ isOpen, onClose, onAccept }: DisclaimerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Data Use Disclaimer</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4">
              <p>
                Before downloading, please review the following terms:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  This data is provided by the Utah Geological Survey (UGS) for informational purposes only.
                </li>
                <li>
                  Data is provided "as-is" without warranty of any kind, express or implied.
                </li>
                <li>
                  Users are responsible for verifying data accuracy for their specific use case.
                </li>
                <li>
                  Please cite the Utah Geological Survey when using this data in publications or reports.
                </li>
                <li>
                  For questions about data methodology or quality, contact the UGS Wetlands Program.
                </li>
              </ul>
              <p className="text-sm text-muted-foreground">
                By clicking "I Accept", you acknowledge that you have read and agree to these terms.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onAccept}>
            I Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
