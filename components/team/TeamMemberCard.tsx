'use client';

// Remove useState if no longer needed for image src
// import { useState } from 'react'; 
import Image from 'next/image';
import { TeamMember } from '@/lib/actions/team';
// Remove Card imports if no longer needed
// import { Card, CardContent, CardHeader } from '@/components/ui/card'; 

interface TeamMemberCardProps {
  member: TeamMember;
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  // Remove state for swapping src
  // const [currentImageUrl, setCurrentImageUrl] = useState<string>(member.primary_image_url);

  return (
    // Remove Card wrapper, use a simple div if needed for grouping or spacing
    <div> 
      {/* Ensure group class is present */}
      <div 
        // Change rounding to a larger arbitrary value
        className="group relative overflow-hidden rounded-tr-[4rem] aspect-square" 
        // Remove mouse handlers for src swapping
        // onMouseEnter={() => setCurrentImageUrl(member.secondary_image_url)}
        // onMouseLeave={() => setCurrentImageUrl(member.primary_image_url)}
      >
        {/* Primary Image (Bottom Layer) */}
        <Image
          src={member.primary_image_url}
          alt={`Photo of ${member.name}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          // Position absolute, apply grayscale/hover/transition
          className="absolute inset-0 object-cover object-top transition-all duration-500 ease-in-out grayscale group-hover:grayscale-0"
          priority={false} // Set to true for above-the-fold images if applicable
        />
        {/* Secondary Image (Top Layer, fades in) */}
        <Image
          src={member.secondary_image_url}
          alt={`Hover photo of ${member.name}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          // Position absolute, apply grayscale/hover/transition, fade in/out
          className="absolute inset-0 object-cover object-top transition-opacity duration-500 ease-in-out grayscale group-hover:grayscale-0 opacity-0 group-hover:opacity-100"
          priority={false} 
        />
      </div>
      {/* Text block below image */}
      <div className="pt-3"> {/* Adjust padding as needed */}
        <h3 className="text-lg font-bold uppercase tracking-wide">{member.name}</h3>
        <p className="text-sm text-muted-foreground uppercase tracking-wide">{member.title}</p>
      </div>
    </div>
  );
} 