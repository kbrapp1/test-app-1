"use client"

import {
    Activity,
    BarChart3,
    Copy,
    Download,
    Edit,
    Eye,
    Mail,
    MessageSquare,
    MoreHorizontal,
    Plus,
    Search,
    Send,
    Target,
    Trash2,
    TrendingUp,
    Upload,
    Users
} from "lucide-react"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

// Mock data for contacts
const contacts = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    company: "TechCorp Inc.",
    position: "Marketing Director",
    status: "active",
    source: "website",
    tags: ["decision-maker", "enterprise", "hot-lead"],
    lastContact: "2024-01-15",
    engagementScore: 85,
    location: "San Francisco, CA",
    industry: "Technology",
    leadScore: 92,
    lastActivity: "Email opened - 2 hours ago"
  },
  {
    id: 2,
    name: "Mike Chen",
    email: "mike.chen@startup.com",
    phone: "+1 (555) 234-5678",
    company: "InnovateStart",
    position: "CEO",
    status: "prospect",
    source: "linkedin",
    tags: ["founder", "startup", "high-value"],
    lastContact: "2024-01-10",
    engagementScore: 78,
    location: "Austin, TX",
    industry: "SaaS",
    leadScore: 88,
    lastActivity: "Website visit - 1 day ago"
  },
  {
    id: 3,
    name: "Emily Davis",
    email: "emily.davis@agency.com",
    phone: "+1 (555) 345-6789",
    company: "Creative Agency",
    position: "Account Manager",
    status: "customer",
    source: "referral",
    tags: ["customer", "agency", "repeat-buyer"],
    lastContact: "2024-01-12",
    engagementScore: 95,
    location: "New York, NY",
    industry: "Marketing",
    leadScore: 100,
    lastActivity: "Purchase made - 3 days ago"
  },
  {
    id: 4,
    name: "Alex Thompson",
    email: "alex.thompson@enterprise.com",
    phone: "+1 (555) 456-7890",
    company: "Enterprise Solutions",
    position: "VP of Sales",
    status: "lead",
    source: "event",
    tags: ["enterprise", "decision-maker", "qualified"],
    lastContact: "2024-01-08",
    engagementScore: 62,
    location: "Chicago, IL",
    industry: "Enterprise",
    leadScore: 75,
    lastActivity: "Demo scheduled - 1 week ago"
  },
  {
    id: 5,
    name: "Lisa Wang",
    email: "lisa.wang@consulting.com",
    phone: "+1 (555) 567-8901",
    company: "Strategic Consulting",
    position: "Partner",
    status: "prospect",
    source: "cold-outreach",
    tags: ["consultant", "influencer", "thought-leader"],
    lastContact: "2024-01-05",
    engagementScore: 45,
    location: "Boston, MA",
    industry: "Consulting",
    leadScore: 68,
    lastActivity: "Email sent - 2 weeks ago"
  }
]

// Mock automation workflows
const automationWorkflows = [
  {
    id: 1,
    name: "Welcome Series",
    status: "active",
    contacts: 1247,
    openRate: 68.5,
    clickRate: 12.3,
    conversions: 89,
    lastTriggered: "2 hours ago"
  },
  {
    id: 2,
    name: "Abandoned Cart Recovery",
    status: "active",
    contacts: 342,
    openRate: 72.1,
    clickRate: 18.7,
    conversions: 45,
    lastTriggered: "1 day ago"
  },
  {
    id: 3,
    name: "Re-engagement Campaign",
    status: "draft",
    contacts: 0,
    openRate: 0,
    clickRate: 0,
    conversions: 0,
    lastTriggered: "Never"
  },
  {
    id: 4,
    name: "Product Launch Sequence",
    status: "active",
    contacts: 892,
    openRate: 75.2,
    clickRate: 22.1,
    conversions: 156,
    lastTriggered: "3 days ago"
  }
]

// Mock segments
const segments = [
  { id: 1, name: "High-Value Prospects", count: 234, criteria: "Lead Score > 80" },
  { id: 2, name: "Enterprise Decision Makers", count: 156, criteria: "Company Size > 500" },
  { id: 3, name: "Recent Customers", count: 89, criteria: "Purchase Date < 30 days" },
  { id: 4, name: "Inactive Contacts", count: 445, criteria: "No activity > 90 days" },
  { id: 5, name: "Email Subscribers", count: 1247, criteria: "Subscribed = true" }
]

// Mock analytics data
const analyticsData = {
  totalContacts: 2847,
  newThisMonth: 234,
  activeContacts: 1892,
  conversionRate: 12.5,
  averageEngagement: 73.2,
  topSources: [
    { source: "Website", count: 892, percentage: 31.3 },
    { source: "LinkedIn", count: 567, percentage: 19.9 },
    { source: "Referrals", count: 445, percentage: 15.6 },
    { source: "Events", count: 334, percentage: 11.7 },
    { source: "Cold Outreach", count: 234, percentage: 8.2 }
  ],
  industryBreakdown: [
    { industry: "Technology", count: 567, percentage: 19.9 },
    { industry: "Marketing", count: 445, percentage: 15.6 },
    { industry: "SaaS", count: 334, percentage: 11.7 },
    { industry: "Enterprise", count: 289, percentage: 10.1 },
    { industry: "Consulting", count: 234, percentage: 8.2 }
  ]
}

export default function ContactsPage() {
  const [selectedContacts, setSelectedContacts] = React.useState<number[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [sourceFilter, setSourceFilter] = React.useState("all")

  const _getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500"
      case "prospect": return "bg-blue-500"
      case "customer": return "bg-purple-500"
      case "lead": return "bg-yellow-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Active"
      case "prospect": return "Prospect"
      case "customer": return "Customer"
      case "lead": return "Lead"
      default: return "Unknown"
    }
  }

  const getEngagementColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getLeadScoreColor = (score: number) => {
    if (score >= 90) return "bg-red-100 text-red-800"
    if (score >= 70) return "bg-yellow-100 text-yellow-800"
    if (score >= 50) return "bg-blue-100 text-blue-800"
    return "bg-gray-100 text-gray-800"
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter
    const matchesSource = sourceFilter === "all" || contact.source === sourceFilter
    return matchesSearch && matchesStatus && matchesSource
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your contact database and marketing automation workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalContacts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.activeContacts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8%</span> engagement rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.1%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.averageEngagement}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5.2%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Management</CardTitle>
              <CardDescription>
                Search, filter, and manage your contact database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search contacts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="cold-outreach">Cold Outreach</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contacts Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lead Score</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedContacts([...selectedContacts, contact.id])
                            } else {
                              setSelectedContacts(selectedContacts.filter(id => id !== contact.id))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder-user.jpg" />
                            <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-sm text-muted-foreground">{contact.email}</div>
                            <div className="text-xs text-muted-foreground">{contact.phone}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{contact.company}</div>
                          <div className="text-sm text-muted-foreground">{contact.position}</div>
                          <div className="text-xs text-muted-foreground">{contact.location}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {getStatusText(contact.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getLeadScoreColor(contact.leadScore)}>
                          {contact.leadScore}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16">
                            <Progress value={contact.engagementScore} className="h-2" />
                          </div>
                          <span className={`text-sm font-medium ${getEngagementColor(contact.engagementScore)}`}>
                            {contact.engagementScore}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {contact.lastActivity}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Contact
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              View History
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Workflows */}
            <Card>
              <CardHeader>
                <CardTitle>Automation Workflows</CardTitle>
                <CardDescription>
                  Manage your marketing automation sequences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {automationWorkflows.map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{workflow.name}</h4>
                        <Badge variant={workflow.status === "active" ? "default" : "secondary"}>
                          {workflow.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {workflow.contacts} contacts • Last triggered: {workflow.lastTriggered}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Open: {workflow.openRate}%</span>
                        <span>Click: {workflow.clickRate}%</span>
                        <span>Conv: {workflow.conversions}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common automation tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Workflow
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Send className="mr-2 h-4 w-4" />
                  Send Bulk Email
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Target className="mr-2 h-4 w-4" />
                  Create Segment
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Segment List */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Segments</CardTitle>
                <CardDescription>
                  Organize contacts into targeted groups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {segments.map((segment) => (
                  <div key={segment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{segment.name}</h4>
                      <div className="text-sm text-muted-foreground">
                        {segment.count} contacts
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {segment.criteria}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Create Segment */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Segment</CardTitle>
                <CardDescription>
                  Build a targeted contact list
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="segment-name">Segment Name</Label>
                  <Input id="segment-name" placeholder="e.g., High-Value Prospects" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="segment-criteria">Criteria</Label>
                  <Textarea 
                    id="segment-criteria" 
                    placeholder="Lead Score > 80 AND Company Size > 100"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="auto-update" />
                  <Label htmlFor="auto-update">Auto-update segment</Label>
                </div>
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Segment
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Source Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Sources</CardTitle>
                <CardDescription>
                  Where your contacts come from
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topSources.map((source) => (
                    <div key={source.source} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">{source.source}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {source.count} ({source.percentage}%)
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Industry Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Industry Distribution</CardTitle>
                <CardDescription>
                  Your contacts by industry
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.industryBreakdown.map((industry) => (
                    <div key={industry.industry} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">{industry.industry}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {industry.count} ({industry.percentage}%)
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Growth</CardTitle>
              <CardDescription>
                Monthly contact acquisition trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  <p>Contact growth chart would be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 