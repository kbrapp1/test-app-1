'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, TrendingUp, Users, MessageCircle } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Analytics & Reports</h2>
        <p className="text-muted-foreground">
          Monitor your chatbot&apos;s performance, visitor engagement, and lead generation metrics.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Key Metrics Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Generated</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conversation Analytics</CardTitle>
            <CardDescription>
              Detailed metrics about visitor interactions and conversation flows.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <BarChart3 className="h-4 w-4" />
              <AlertDescription>
                Conversation analytics will be available in the next implementation phase.
                This will include metrics like engagement rate, drop-off points, and popular topics.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Quality Analysis</CardTitle>
            <CardDescription>
              Insights into lead qualification scores and conversion patterns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                Lead quality analysis will be available in the next implementation phase.
                This will include lead scoring trends, qualification success rates, and ROI metrics.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
          <CardDescription>
            Download detailed reports for further analysis and sharing with your team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertDescription>
              Report export functionality will be available in the next implementation phase.
              You&apos;ll be able to export conversation logs, lead data, and performance metrics in CSV and PDF formats.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
} 