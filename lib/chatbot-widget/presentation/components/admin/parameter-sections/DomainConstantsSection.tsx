/**
 * Domain Constants Section
 * 
 * Component for displaying domain constants and framework information.
 * Single responsibility: Display domain model constants and statistics.
 */

import { IntentClassificationDisplay } from './domain-constants/IntentClassificationDisplay';
import { CustomerJourneyDisplay } from './domain-constants/CustomerJourneyDisplay';
import { EntityFrameworkDisplay } from './domain-constants/EntityFrameworkDisplay';
import { EnumeratedValuesDisplay } from './domain-constants/EnumeratedValuesDisplay';
import { DomainStatisticsDisplay } from './domain-constants/DomainStatisticsDisplay';

export function DomainConstantsSection() {
  return (
    <div className="space-y-8">
      <IntentClassificationDisplay />
      <CustomerJourneyDisplay />
      <EntityFrameworkDisplay />
      <EnumeratedValuesDisplay />
      <DomainStatisticsDisplay />
    </div>
  );
} 