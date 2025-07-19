"use client"

import {
  BarChart3,
  Edit,
  Eye,
  MoreVertical,
  Pause,
  Play,
  Plus,
  Search,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users
} from "lucide-react"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for campaigns
const campaigns = [
  {
    id: 1,
    name: "Summer Sale 2024",
    status: "active",
    type: "Email",
    budget: 5000,
    spent: 3200,
    impressions: 45000,
    clicks: 2200,
    conversions: 180,
    startDate: "2024-06-01",
    endDate: "2024-08-31",
    manager: "Sarah Johnson",
    avatar: "/placeholder-user.jpg"
  },
  {
    id: 2,
    name: "Holiday Special",
    status: "draft",
    type: "Social Media",
    budget: 3000,
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    startDate: "2024-11-01",
    endDate: "2024-12-31",
    manager: "Mike Chen",
    avatar: "/placeholder-user.jpg"
  },
  {
    id: 3,
    name: "Product Launch",
    status: "paused",
    type: "PPC",
    budget: 8000,
    spent: 4500,
    impressions: 67000,
    clicks: 3400,
    conversions: 290,
    startDate: "2024-05-15",
    endDate: "2024-07-15",
    manager: "Emily Davis",
    avatar: "/placeholder-user.jpg"
  },
  {
    id: 4,
    name: "Brand Awareness",
    status: "active",
    type: "Display",
    budget: 12000,
    spent: 8900,
    impressions: 125000,
    clicks: 5600,
    conversions: 420,
    startDate: "2024-04-01",
    endDate: "2024-09-30",
    manager: "Alex Thompson",
    avatar: "/placeholder-user.jpg"
  }
]

// Mock chart data
const performanceData = [
  { month: "Jan", impressions: 45000, clicks: 2200, conversions: 180 },
  { month: "Feb", impressions: 52000, clicks: 2800, conversions: 220 },
  { month: "Mar", impressions: 48000, clicks: 2400, conversions: 190 },
  { month: "Apr", impressions: 61000, clicks: 3200, conversions: 260 },
  { month: "May", impressions: 67000, clicks: 3400, conversions: 290 },
  { month: "Jun", impressions: 72000, clicks: 3800, conversions: 320 }
]

// Mock calendar events
const calendarEvents = [
  { date: new Date(2024, 5, 15), title: "Campaign Review", type: "meeting" },
  { date: new Date(2024, 5, 20), title: "Budget Approval", type: "task" },
  { date: new Date(2024, 5, 25), title: "Creative Deadline", type: "deadline" },
  { date: new Date(2024, 6, 1), title: "New Campaign Launch", type: "launch" }
]

export default function CampaignManagementPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [_selectedCampaign, _setSelectedCampaign] = React.useState<number | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500"
      case "paused": return "bg-yellow-500"
      case "draft": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Active"
      case "paused": return "Paused"
      case "draft": return "Draft"
      default: return "Unknown"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Email": return "bg-blue-100 text-blue-800"
      case "Social Media": return "bg-purple-100 text-purple-800"
      case "PPC": return "bg-orange-100 text-orange-800"
      case "Display": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaign Management</h1>
          <p className="text-muted-foreground">Manage and monitor your marketing campaigns</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +1 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$28,000</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 text-red-500" />
              -5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,240</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +12% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Monthly performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.map((data, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{data.month}</span>
                        <span className="text-muted-foreground">
                          {data.conversions} conversions
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Impressions: {data.impressions.toLocaleString()}</span>
                          <span>Clicks: {data.clicks.toLocaleString()}</span>
                        </div>
                        <Progress value={(data.conversions / 400) * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest campaign updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Summer Sale campaign launched</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Budget increased for Brand Awareness</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Product Launch paused for review</p>
                      <p className="text-xs text-muted-foreground">2 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          {/* Campaign Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
              <CardDescription>Manage and monitor your campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search campaigns..." className="pl-10" />
                  </div>
                </div>
                <Select>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="ppc">PPC</SelectItem>
                    <SelectItem value="display">Display</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campaigns Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {campaign.startDate} - {campaign.endDate}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(campaign.status)}`}></div>
                            <span className="text-sm">{getStatusText(campaign.status)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getTypeColor(campaign.type)}>
                            {campaign.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">${campaign.budget.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">
                              Spent: ${campaign.spent.toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {campaign.conversions} conversions
                            </div>
                            <Progress 
                              value={(campaign.spent / campaign.budget) * 100} 
                              className="h-2 w-20" 
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={campaign.avatar} />
                              <AvatarFallback>
                                {campaign.manager.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{campaign.manager}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Campaign
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Play className="mr-2 h-4 w-4" />
                                Resume
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Pause className="mr-2 h-4 w-4" />
                                Pause
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Campaign Calendar</CardTitle>
                <CardDescription>Schedule and track campaign events</CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {calendarEvents.map((event, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        event.type === 'meeting' ? 'bg-blue-500' :
                        event.type === 'task' ? 'bg-green-500' :
                        event.type === 'deadline' ? 'bg-red-500' :
                        'bg-purple-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.date.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Campaign performance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Impressions</span>
                      <span className="font-medium">335,000</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Clicks</span>
                      <span className="font-medium">16,800</span>
                    </div>
                    <Progress value={5} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Conversions</span>
                      <span className="font-medium">1,240</span>
                    </div>
                    <Progress value={0.37} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Campaigns</CardTitle>
                <CardDescription>By conversion rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns
                    .sort((a, b) => (b.conversions / b.clicks) - (a.conversions / a.clicks))
                    .slice(0, 3)
                    .map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {campaign.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{campaign.name}</p>
                            <p className="text-xs text-muted-foreground">{campaign.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {((campaign.conversions / campaign.clicks) * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {campaign.conversions} conversions
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 