/**
 * Website Sources Form Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Website source form management
 * - Keep under 200 lines - focused component
 * - Follow @golden-rule patterns exactly
 * - Handle form state through props, delegate actions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { WebsiteSourceFormData } from '../../../actions/websiteSourcesActions';

interface WebsiteSourcesFormProps {
  formData: WebsiteSourceFormData;
  onUpdateFormData: (updates: Partial<WebsiteSourceFormData>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  actionLoading: boolean;
}

export function WebsiteSourcesForm({ 
  formData, 
  onUpdateFormData, 
  onSubmit, 
  onCancel, 
  actionLoading 
}: WebsiteSourcesFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Website Source</CardTitle>
        <CardDescription>
          Configure website crawling settings and content preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) => onUpdateFormData({ url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              placeholder="Company Website"
              value={formData.name}
              onChange={(e) => onUpdateFormData({ name: e.target.value })}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Brief description of this website source..."
            value={formData.description}
            onChange={(e) => onUpdateFormData({ description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxPages">Max Pages</Label>
            <Input
              id="maxPages"
              type="number"
              min="1"
              max="1000"
              value={formData.maxPages}
              onChange={(e) => onUpdateFormData({ maxPages: parseInt(e.target.value) || 50 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxDepth">Max Depth</Label>
            <Input
              id="maxDepth"
              type="number"
              min="1"
              max="10"
              value={formData.maxDepth}
              onChange={(e) => onUpdateFormData({ maxDepth: parseInt(e.target.value) || 3 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="respectRobotsTxt">Respect robots.txt</Label>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="respectRobotsTxt"
                checked={formData.respectRobotsTxt}
                onCheckedChange={(checked) => onUpdateFormData({ respectRobotsTxt: checked })}
              />
              <span className="text-sm text-muted-foreground">Recommended</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onSubmit} disabled={actionLoading}>
            {actionLoading ? 'Adding...' : 'Add Website'}
          </Button>
          <Button 
            onClick={onCancel}
            variant="outline"
            disabled={actionLoading}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 