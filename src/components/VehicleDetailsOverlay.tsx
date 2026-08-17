import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Vehicle, statusStyles } from "@/lib/firebase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import { motion } from "motion/react";

interface VehicleDetailsOverlayProps {
  vehicle: Vehicle;
  onClose: () => void;
  className?: string;
}

export const VehicleDetailsOverlay = ({ vehicle, onClose, className }: VehicleDetailsOverlayProps) => {
  const { convertPrice } = useCurrency();
  const { t, language } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const getStatusLabel = (status: string) => {
    if (language === 'ja') {
      switch (status) {
        case 'AVAILABLE': return '販売中';
        case 'IN_TRANSIT': return '輸送中';
        case 'SOURCING': return '仕入れ中';
        case 'SOLD': return '売約済';
        default: return status;
      }
    }
    return status;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`z-[100] bg-background/95 backdrop-blur-md p-5 lg:p-10 overflow-y-auto border-2 border-bronze shadow-[0_0_20px_rgba(205,127,50,0.3)] flex flex-col ${className || "fixed inset-0 lg:inset-4 lg:h-auto lg:max-h-[500px]"}`}
    >
      <div className="flex justify-between items-start mb-1 lg:mb-4 gap-4 sticky top-0 bg-background/95 pb-2 lg:pb-4 z-10">
        <div>
          <h2 className="font-display text-lg lg:text-2xl leading-tight mb-0.5 lg:mb-2">
            {vehicle.year} {vehicle.name}
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`rounded-sm uppercase tracking-wider text-[8px] lg:text-[10px] h-3.5 lg:h-5 px-1 lg:px-2.5 font-mono ${statusStyles[vehicle.status]}`}>
              {getStatusLabel(vehicle.status)}
            </Badge>
            <span className="font-display text-base lg:text-xl text-bronze">
              {convertPrice(vehicle.priceJPY).formatted}
            </span>
            {vehicle.stockNumber && (
              <span className="mono text-[10px] lg:text-xs text-muted-foreground ml-2">
                {t.vehicleOverlay.stock}: {vehicle.stockNumber}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="text-xs lg:text-sm text-muted-foreground mb-4 lg:mb-6 leading-relaxed line-clamp-3 lg:line-clamp-none">
        {vehicle.description || t.vehicleOverlay.defaultDesc}
      </p>

      <div className="grid grid-cols-2 gap-x-4 lg:gap-x-6 gap-y-2 lg:gap-y-4 text-[13px] lg:text-sm mt-auto border-t border-border pt-3 lg:pt-4">
        <div className="flex justify-between border-b border-border/50 pb-1 lg:pb-2">
          <span className="text-muted-foreground">{t.vehicleOverlay.price}</span>
          <span className="font-medium">{convertPrice(vehicle.priceJPY).formatted}</span>
        </div>
        <div className="flex justify-between border-b border-border/50 pb-1 lg:pb-2">
          <span className="text-muted-foreground">{t.vehicleOverlay.year}</span>
          <span className="font-medium">{vehicle.year}</span>
        </div>
        
        <div className="flex justify-between border-b border-border/50 pb-1 lg:pb-2">
          <span className="text-muted-foreground">{t.vehicleOverlay.mileage}</span>
          <span className="font-medium">{vehicle.mileage}</span>
        </div>
        <div className="flex justify-between border-b border-border/50 pb-1 lg:pb-2">
          <span className="text-muted-foreground">{t.vehicleOverlay.displacement}</span>
          <span className="font-medium">{vehicle.displacementCc} cc</span>
        </div>
        
        <div className="flex justify-between border-b border-border/50 pb-1 lg:pb-2">
          <span className="text-muted-foreground">{t.vehicleOverlay.transmission}</span>
          <span className="font-medium">{vehicle.transmission}</span>
        </div>
        <div className="flex justify-between border-b border-border/50 pb-1 lg:pb-2">
          <span className="text-muted-foreground">{t.vehicleOverlay.color}</span>
          <span className="font-medium text-right truncate ml-2">{vehicle.color || t.vehicleOverlay.onRequest}</span>
        </div>
        
        <div className="flex justify-between border-b border-border/50 pb-1 lg:pb-2">
          <span className="text-muted-foreground">{t.vehicleOverlay.repaired}</span>
          <span className="font-medium">{vehicle.repaired || t.vehicleOverlay.noRepair}</span>
        </div>
        <div className="flex justify-between border-b border-border/50 pb-1 lg:pb-2">
          <span className="text-muted-foreground">{t.vehicleOverlay.seating}</span>
          <span className="font-medium">{vehicle.seatingCapacity || "-"}</span>
        </div>
        
        <div className="flex justify-between border-b border-border/50 pb-1 lg:pb-2">
          <span className="text-muted-foreground">{t.vehicleOverlay.grade}</span>
          <span className="font-medium">{vehicle.grade.replace("Auction Grade ", "")}</span>
        </div>
        <div className="flex justify-between border-b border-border/50 pb-1 lg:pb-2">
          <span className="text-muted-foreground">{t.vehicleOverlay.drive}</span>
          <span className="font-medium">{vehicle.driveSystem || "RWD/AWD"}</span>
        </div>
      </div>

      <div className="text-center mt-4 lg:mt-6">
        <button
          onClick={onClose}
          className="text-[9px] lg:text-xs text-bronze uppercase tracking-widest hover:underline"
        >
          <span className="lg:hidden text-[10px]">{t.vehicleOverlay.closeMobile}</span>
          <span className="hidden lg:inline">{t.vehicleOverlay.closeDesktop}</span>
        </button>
      </div>
    </motion.div>
  );
};
