"use client"

import {
    AlertCircle,
    BarChart3,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Edit,
    Eye,
    FileText,
    Globe,
    Image,
    MoreVertical,
    Plus,
    Search,
    Settings,
    Share2,
    Tag,
    Trash2,
    TrendingUp,
    Upload,
    Users,
    Video,
    XCircle
} from "lucide-react"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"

// Mock data for content pieces
const contentPieces = [
  {
    id: 1,
    title: "Summer Product Launch Blog Post",
    type: "blog",
    status: "draft",
    author: "Sarah Johnson",
    avatar: "/placeholder-user.jpg",
    publishDate: "2024-06-15",
    channels: ["website", "social"],
    tags: ["product", "launch", "summer"],
    priority: "high",
    wordCount: 1200,
    thumbnail: "/content/blog-summer.jpg"
  },
  {
    id: 2,
    title: "Instagram Reel: Behind the Scenes",
    type: "video",
    status: "scheduled",
    author: "Mike Chen",
    avatar: "/placeholder-user.jpg",
    publishDate: "2024-06-10",
    channels: ["instagram", "tiktok"],
    tags: ["behind-scenes", "video", "social"],
    priority: "medium",
    duration: "60s",
    thumbnail: "/content/instagram-reel.jpg"
  },
  {
    id: 3,
    title: "Email Newsletter: Weekly Updates",
    type: "email",
    status: "published",
    author: "Emily Davis",
    avatar: "/placeholder-user.jpg",
    publishDate: "2024-06-08",
    channels: ["email"],
    tags: ["newsletter", "weekly", "updates"],
    priority: "high",
    openRate: "24.5%",
    clickRate: "3.2%"
  },
  {
    id: 4,
    title: "LinkedIn Article: Industry Trends",
    type: "article",
    status: "review",
    author: "Alex Thompson",
    avatar: "/placeholder-user.jpg",
    publishDate: "2024-06-20",
    channels: ["linkedin"],
    tags: ["industry", "trends", "thought-leadership"],
    priority: "medium",
    wordCount: 800,
    thumbnail: "/content/linkedin-article.jpg"
  },
  {
    id: 5,
    title: "Facebook Ad: Product Promotion",
    type: "ad",
    status: "active",
    author: "Lisa Wang",
    avatar: "/placeholder-user.jpg",
    publishDate: "2024-06-05",
    channels: ["facebook", "instagram"],
    tags: ["ad", "promotion", "product"],
    priority: "high",
    impressions: 45000,
    clicks: 1200,
    ctr: "2.7%"
  }
]

// Mock calendar events
const calendarEvents = [
  { 
    date: new Date(2024, 11, 10), // December 10, 2024
    title: "Instagram Reel: Behind the Scenes", 
    type: "video",
    status: "scheduled",
    time: "10:00 AM"
  },
  { 
    date: new Date(2024, 11, 15), // December 15, 2024
    title: "Summer Product Launch Blog Post", 
    type: "blog",
    status: "draft",
    time: "2:00 PM"
  },
  { 
    date: new Date(2024, 11, 20), // December 20, 2024
    title: "LinkedIn Article: Industry Trends", 
    type: "article",
    status: "review",
    time: "9:00 AM"
  },
  { 
    date: new Date(2024, 11, 25), // December 25, 2024
    title: "Monthly Newsletter", 
    type: "email",
    status: "planned",
    time: "11:00 AM"
  },
  { 
    date: new Date(2024, 11, 28), // December 28, 2024
    title: "Product Demo Video", 
    type: "video",
    status: "draft",
    time: "3:00 PM"
  },
  // Add some events for the next few days
  { 
    date: new Date(), // Today
    title: "Daily Social Media Post", 
    type: "social",
    status: "scheduled",
    time: "9:00 AM"
  },
  { 
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    title: "Weekly Blog Post", 
    type: "blog",
    status: "draft",
    time: "2:00 PM"
  },
  { 
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    title: "Email Campaign", 
    type: "email",
    status: "scheduled",
    time: "10:00 AM"
  },
  { 
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    title: "Product Video", 
    type: "video",
    status: "review",
    time: "3:00 PM"
  },
  { 
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    title: "Industry Article", 
    type: "article",
    status: "draft",
    time: "11:00 AM"
  }
]

// Mock analytics data
const analyticsData = {
  totalContent: 45,
  publishedThisMonth: 12,
  scheduledContent: 8,
  draftContent: 15,
  topPerforming: [
    { title: "Summer Product Launch", engagement: 89, views: 12500 },
    { title: "Behind the Scenes Video", engagement: 76, views: 8900 },
    { title: "Industry Trends Article", engagement: 67, views: 7200 }
  ],
  channelPerformance: [
    { channel: "Instagram", posts: 15, engagement: 4.2 },
    { channel: "LinkedIn", posts: 8, engagement: 3.8 },
    { channel: "Blog", posts: 12, engagement: 2.1 },
    { channel: "Email", posts: 4, engagement: 24.5 }
  ]
}

export default function ContentCalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date()) // Current date
  const [_selectedContent, _setSelectedContent] = React.useState<number | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-500"
      case "scheduled": return "bg-blue-500"
      case "draft": return "bg-gray-500"
      case "review": return "bg-yellow-500"
      case "active": return "bg-purple-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "published": return "Published"
      case "scheduled": return "Scheduled"
      case "draft": return "Draft"
      case "review": return "In Review"
      case "active": return "Active"
      default: return "Unknown"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "blog": return <FileText className="h-4 w-4" />
      case "video": return <Video className="h-4 w-4" />
      case "email": return <FileText className="h-4 w-4" />
      case "article": return <FileText className="h-4 w-4" />
      case "ad": return <BarChart3 className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "low": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "website": return <Globe className="h-3 w-3" />
      case "social": return <Share2 className="h-3 w-3" />
      case "instagram": return <Image className="h-3 w-3" aria-label="Instagram" />
      case "tiktok": return <Video className="h-3 w-3" />
      case "email": return <FileText className="h-3 w-3" />
      case "linkedin": return <Users className="h-3 w-3" />
      case "facebook": return <Globe className="h-3 w-3" />
      default: return <Globe className="h-3 w-3" />
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'blog': return 'bg-blue-500'
      case 'video': return 'bg-purple-500'
      case 'email': return 'bg-green-500'
      case 'article': return 'bg-orange-500'
      case 'social': return 'bg-pink-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Calendar</h1>
          <p className="text-muted-foreground">Plan, schedule, and manage your content strategy</p>
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
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Content
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalContent}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +5 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.publishedThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" />
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Content</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.scheduledContent}</div>
            <p className="text-xs text-muted-foreground">
              <AlertCircle className="inline h-3 w-3 text-yellow-500" />
              {analyticsData.scheduledContent} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Content</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.draftContent}</div>
            <p className="text-xs text-muted-foreground">
              <XCircle className="inline h-3 w-3 text-gray-500" />
              Needs attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="manage">Content List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Content Calendar</CardTitle>
                    <CardDescription>{format(new Date(), 'MMMM yyyy')} - Content Schedule</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Calendar Legend */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-100 rounded"></div>
                      <span>Blog Posts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-100 rounded"></div>
                      <span>Videos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-100 rounded"></div>
                      <span>Emails</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-100 rounded"></div>
                      <span>Articles</span>
                    </div>
                  </div>
                  
                  {/* Calendar */}
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Content */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Content</CardTitle>
                <CardDescription>Next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {calendarEvents
                    .filter(calendarEvent => {
                      const eventDate = new Date(calendarEvent.date)
                      const today = new Date()
                      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                      return eventDate >= today && eventDate <= nextWeek
                    })
                    .map((calendarEvent, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          getEventTypeColor(calendarEvent.type)
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{calendarEvent.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {calendarEvent.type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {calendarEvent.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(calendarEvent.date, 'MMM dd')} at {calendarEvent.time}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          {/* Content Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
              <CardDescription>Manage and organize your content pieces</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search content..." className="pl-10" />
                  </div>
                </div>
                <Select>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">In Review</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="blog">Blog Posts</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="email">Emails</SelectItem>
                    <SelectItem value="article">Articles</SelectItem>
                    <SelectItem value="ad">Ads</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Content Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Publish Date</TableHead>
                      <TableHead>Channels</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contentPieces.map((content) => (
                      <TableRow key={content.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              {getTypeIcon(content.type)}
                            </div>
                            <div>
                              <div className="font-medium">{content.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {content.wordCount && `${content.wordCount} words`}
                                {content.duration && `${content.duration}`}
                                {content.openRate && `Open: ${content.openRate}`}
                                {content.impressions && `${content.impressions.toLocaleString()} impressions`}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {content.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(content.status)}`}></div>
                            <span className="text-sm">{getStatusText(content.status)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={content.avatar} />
                              <AvatarFallback>
                                {content.author.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{content.author}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(content.publishDate), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {content.channels.slice(0, 2).map((channel, index) => (
                              <div key={index} className="flex items-center gap-1">
                                {getChannelIcon(channel)}
                                <span className="text-xs">{channel}</span>
                              </div>
                            ))}
                            {content.channels.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{content.channels.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getPriorityColor(content.priority)}>
                            {content.priority}
                          </Badge>
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
                                Edit Content
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Share2 className="mr-2 h-4 w-4" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Export
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

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Content */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Content</CardTitle>
                <CardDescription>By engagement rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topPerforming.map((content, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{content.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {content.views.toLocaleString()} views
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{content.engagement}%</p>
                        <p className="text-xs text-muted-foreground">engagement</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Channel Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
                <CardDescription>Engagement by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.channelPerformance.map((channel, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{channel.channel}</span>
                        <span className="text-muted-foreground">
                          {channel.posts} posts
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Engagement Rate</span>
                          <span>{channel.engagement}%</span>
                        </div>
                        <Progress value={channel.engagement * 10} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Content Planning Board */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Content Planning Board</CardTitle>
                <CardDescription>Plan your content strategy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Ideas Column */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Ideas</h3>
                      <Badge variant="secondary">3</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm font-medium">Customer Success Stories</p>
                        <p className="text-xs text-muted-foreground">Blog post series</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Tag className="h-3 w-3" />
                          <span className="text-xs">blog, case-study</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm font-medium">Product Tutorial Video</p>
                        <p className="text-xs text-muted-foreground">How-to guide</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Tag className="h-3 w-3" />
                          <span className="text-xs">video, tutorial</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* In Progress Column */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">In Progress</h3>
                      <Badge variant="secondary">2</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium">Industry Report</p>
                        <p className="text-xs text-muted-foreground">Research in progress</p>
                        <Progress value={60} className="h-1 mt-2" />
                      </div>
                    </div>
                  </div>

                  {/* Ready to Publish Column */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Ready to Publish</h3>
                      <Badge variant="secondary">1</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm font-medium">Monthly Newsletter</p>
                        <p className="text-xs text-muted-foreground">Scheduled for June 25</p>
                        <div className="flex items-center gap-1 mt-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600">Ready</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common content tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Blog Post
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Video className="h-4 w-4 mr-2" />
                  Record Video
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Draft Email
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Share2 className="h-4 w-4 mr-2" />
                  Social Media Post
                </Button>
                <Separator />
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Content Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 