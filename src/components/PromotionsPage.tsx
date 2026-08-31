import { HierarchyPromotionsSection } from './HierarchyPromotionsSection';
import { StorePromotionsSection } from './StorePromotionsSection';

/** Trasa `/promotions` łączy promocje punktowe i promocje hierarchii. */
export function PromotionsPage() {
  return (
    <>
      <StorePromotionsSection />
      <HierarchyPromotionsSection />
    </>
  );
}
