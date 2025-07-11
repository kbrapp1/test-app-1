/**
 * Next.js Server Component that renders a card for a team member.
 * It includes an image and text block below the image.
 * The image is displayed in a group with a hover effect.
 */

import Image from 'next/image';
import type { TeamMember } from '@/types/team';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface TeamMemberCardProps {
  member: TeamMember;
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  return (
    <div>
      <div className="w-full overflow-hidden rounded-tr-[4rem]">
        <AspectRatio ratio={1} className="group relative bg-muted">
          <Image
            src={member.primary_image_url}
            alt={`Photo of ${member.name}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="absolute inset-0 object-cover object-top transition-all duration-500 ease-in-out grayscale group-hover:grayscale-0"
            priority={true}
          />
          <Image
            src={member.secondary_image_url}
            alt={`Hover photo of ${member.name}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="absolute inset-0 object-cover object-top transition-opacity duration-500 ease-in-out grayscale group-hover:grayscale-0 opacity-0 group-hover:opacity-100"
            priority={true} 
          />
        </AspectRatio>
      </div>
      <div className="pt-3">
        <h3 className="text-lg font-bold uppercase tracking-wide">{member.name}</h3>
        <p className="text-sm text-muted-foreground uppercase tracking-wide">{member.title}</p>
      </div>
    </div>
  );
} 