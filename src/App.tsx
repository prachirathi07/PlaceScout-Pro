import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Copy, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  MapPin, 
  Phone, 
  Clock, 
  Star, 
  ExternalLink,
  TrendingUp,
  Users,
  Target,
  Zap,
  Globe,
  Award,
  BarChart3,
  Download,
  Filter,
  RefreshCw,
  Building2,
  Mail,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface WebhookResponse {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

interface Place {
  title: string;
  subTitle?: string;
  categoryName: string;
  address: string;
  phone?: string;
  totalScore?: number;
  reviewsCount?: number;
  openingHours?: Array<{ day: string; hours: string }>;
  website?: string;
  imageUrl?: string;
  permanentlyClosed: boolean;
  temporarilyClosed: boolean;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

interface SearchStats {
  totalPlaces: number;
  avgRating: number;
  openNow: number;
  hasWebsite: number;
}

type SortField = 'title' | 'categoryName' | 'totalScore' | 'reviewsCount' | 'city';
type SortDirection = 'asc' | 'desc';

function App() {
  const [location, setLocation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [response, setResponse] = useState<WebhookResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);
  const [sortField, setSortField] = useState<SortField>('totalScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isPlacesData = (data: any): data is Place[] => {
    return Array.isArray(data) && data.length > 0 && data[0].title && data[0].address;
  };

  const calculateStats = (places: Place[]): SearchStats => {
    const totalPlaces = places.length;
    const avgRating = places.reduce((sum, place) => sum + (place.totalScore || 0), 0) / totalPlaces;
    const openNow = places.filter(place => !place.permanentlyClosed && !place.temporarilyClosed).length;
    const hasWebsite = places.filter(place => place.website).length;
    
    return { totalPlaces, avgRating, openNow, hasWebsite };
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const getSortedAndFilteredPlaces = (places: Place[]) => {
    let filtered = places;
    
    if (filterText) {
      filtered = places.filter(place => 
        place.title.toLowerCase().includes(filterText.toLowerCase()) ||
        place.categoryName.toLowerCase().includes(filterText.toLowerCase()) ||
        place.address.toLowerCase().includes(filterText.toLowerCase()) ||
        place.city?.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'totalScore' || sortField === 'reviewsCount') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      } else {
        aValue = (aValue || '').toString().toLowerCase();
        bValue = (bValue || '').toString().toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };
  const formatOpeningHours = (hours: Array<{ day: string; hours: string }>) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayHours = hours.find(h => h.day === today);
    return todayHours ? `${todayHours.day}: ${todayHours.hours}` : 'Hours not available';
  };

  const webhookUrl = 'https://n8n.srv963601.hstgr.cloud/webhook/9fba89b1-9202-4ec0-9845-fb331ede3582';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !searchTerm.trim()) {
      setError('Please fill in both location and search term');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('field1', location);
      params.append('field2', searchTerm);
      params.append('limit', itemsPerPage.toString()); // Add the number of entries parameter

      const fullUrl = `${webhookUrl}?${params.toString()}`;
      
      const res = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseData = await res.text();
      let parsedData;
      
      try {
        parsedData = JSON.parse(responseData);
      } catch {
        parsedData = responseData;
      }

      const headers: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const responseObj = {
        data: parsedData,
        status: res.status,
        statusText: res.statusText,
        headers,
      };

      setResponse(responseObj);

      // Calculate stats if it's places data
      if (isPlacesData(parsedData)) {
        setSearchStats(calculateStats(parsedData));
        setCurrentPage(1);
        setFilterText('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const clearResponse = () => {
    setResponse(null);
    setError(null);
    setSearchStats(null);
    setCurrentPage(1);
    setFilterText('');
  };

  const copyResponse = async () => {
    if (response) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  };

  const exportData = () => {
    if (response && isPlacesData(response.data)) {
      const sortedData = getSortedAndFilteredPlaces(response.data);
      const csvContent = [
        ['Business Name', 'Category', 'Rating', 'Reviews', 'Phone', 'Address', 'City', 'State', 'Website', 'Status'].join(','),
        ...sortedData.map(place => [
          `"${place.title}"`,
          `"${place.categoryName}"`,
          place.totalScore || '',
          place.reviewsCount || '',
          place.phone || '',
          `"${place.address}"`,
          `"${place.city || ''}"`,
          `"${place.state || ''}"`,
          place.website || '',
          place.permanentlyClosed ? 'Permanently Closed' : place.temporarilyClosed ? 'Temporarily Closed' : 'Open'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `placescout-${searchTerm}-${location}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600 bg-green-50 border-green-200';
    if (status >= 400 && status < 500) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (status >= 500) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="glass-card border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">PlaceScout Pro</h1>
                <p className="text-sm text-gray-600">Local Business Intelligence Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  For Freelancers
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  Real-time Data
                </span>
              </div>
              <button className="btn-secondary">
                <Mail className="w-4 h-4 mr-2" />
                Contact
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Discover Local Business
            <span className="gradient-text block">Intelligence</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Professional-grade local business research platform designed for freelancers, agencies, and consultants. 
            Generate comprehensive market insights and lead lists in seconds.
          </p>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {[
              { icon: Target, text: 'Lead Generation' },
              { icon: BarChart3, text: 'Market Analysis' },
              { icon: Globe, text: 'Global Coverage' },
              { icon: Award, text: 'Professional Grade' }
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                <Icon className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        {searchStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="metric-card text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{searchStats.totalPlaces}</div>
              <div className="text-sm text-gray-600">Places Found</div>
            </div>
            <div className="metric-card text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{searchStats.avgRating.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </div>
            <div className="metric-card text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{searchStats.openNow}</div>
              <div className="text-sm text-gray-600">Open Now</div>
            </div>
            <div className="metric-card text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">{searchStats.hasWebsite}</div>
              <div className="text-sm text-gray-600">With Website</div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Search Panel */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-3xl p-8 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Business Research</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Target Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="input-field"
                    placeholder="e.g., New York, NY or London, UK"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">Enter city, state, or specific area</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Business Category
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field"
                    placeholder="e.g., restaurants, gyms, dentists"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">Specify the type of business you're researching</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Number of Entries
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="input-field"
                  >
                    <option value={10}>10 entries</option>
                    <option value={50}>50 entries</option>
                    <option value={100}>100 entries</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">Select how many results to display per page</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-3 text-lg py-4"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing Market...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        Start Research
                      </>
                    )}
                  </button>
                  {response && (
                    <button
                      onClick={exportData}
                      className="btn-secondary flex items-center justify-center gap-2 px-4"
                    >
                      <Download className="w-5 h-5" />
                      Export CSV
                    </button>
                  )}
                </div>

                {/* Quick Actions */}
                {response && (
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={copyResponse}
                      className="btn-secondary flex-1 flex items-center justify-center gap-2"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      Copy JSON
                    </button>
                    <button
                      onClick={clearResponse}
                      className="btn-secondary flex-1 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-3">
            <div className="glass-card rounded-3xl p-8 min-h-[600px]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Research Results</h3>
                </div>
                
                {response && (
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(response.status)}`}>
                      {response.status} {response.statusText}
                    </span>
                  </div>
                )}
              </div>

              {error ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 text-red-800 font-semibold mb-2">
                    <AlertCircle className="w-6 h-6" />
                    Research Failed
                  </div>
                  <p className="text-red-700">{error}</p>
                </div>
              ) : response && Array.isArray(response.data) && response.data.length > 0 && response.data[0].title ? (
                <div className="space-y-6">
                  {/* Table Controls */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h4 className="text-lg font-semibold text-gray-800">
                        {getSortedAndFilteredPlaces(response.data).length} of {response.data.length} Businesses
                      </h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Filter businesses..."
                          value={filterText}
                          onChange={(e) => {
                            setFilterText(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="pl-10 pr-4 py-2 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        />
                      </div>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-3 py-2 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      >
                        <option value={10}>10 entries</option>
                        <option value={50}>50 entries</option>
                        <option value={100}>100 entries</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Professional Data Table */}
                  <div className="bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4 text-left">
                              <button
                                onClick={() => handleSort('title')}
                                className="flex items-center gap-2 font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                              >
                                Business Name
                                {getSortIcon('title')}
                              </button>
                            </th>
                            <th className="px-6 py-4 text-left">
                              <button
                                onClick={() => handleSort('categoryName')}
                                className="flex items-center gap-2 font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                              >
                                Category
                                {getSortIcon('categoryName')}
                              </button>
                            </th>
                            <th className="px-6 py-4 text-left">
                              <button
                                onClick={() => handleSort('totalScore')}
                                className="flex items-center gap-2 font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                              >
                                Rating
                                {getSortIcon('totalScore')}
                              </button>
                            </th>
                            <th className="px-6 py-4 text-left">
                              <button
                                onClick={() => handleSort('reviewsCount')}
                                className="flex items-center gap-2 font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                              >
                                Reviews
                                {getSortIcon('reviewsCount')}
                              </button>
                            </th>
                            <th className="px-6 py-4 text-left">
                              <button
                                onClick={() => handleSort('city')}
                                className="flex items-center gap-2 font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                              >
                                Location
                                {getSortIcon('city')}
                              </button>
                            </th>
                            <th className="px-6 py-4 text-left">Contact</th>
                            <th className="px-6 py-4 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(() => {
                            const sortedData = getSortedAndFilteredPlaces(response.data);
                            const startIndex = (currentPage - 1) * itemsPerPage;
                            const endIndex = startIndex + itemsPerPage;
                            const paginatedData = sortedData.slice(startIndex, endIndex);
                            
                            return paginatedData.map((place, index) => (
                              <tr key={index} className="hover:bg-white/40 transition-colors duration-200">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    {place.imageUrl && (
                                      <img 
                                        src={place.imageUrl} 
                                        alt={place.title}
                                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 shadow-sm"
                                      />
                                    )}
                                    <div>
                                      <div className="font-semibold text-gray-900 leading-tight">
                                        {place.title}
                                      </div>
                                      {place.subTitle && (
                                        <div className="text-sm text-gray-500 mt-1">
                                          {place.subTitle}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium">
                                    {place.categoryName}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {place.totalScore ? (
                                    <div className="flex items-center gap-1">
                                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                      <span className="font-semibold text-gray-900">{place.totalScore}</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">No rating</span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-gray-700 font-medium">
                                    {place.reviewsCount || 0}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="space-y-1">
                                    {place.phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-3 h-3 text-gray-400" />
                                        <a href={`tel:${place.phone}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                          {place.phone}
                                        </a>
                                      </div>
                                    )}
                                    {place.website && (
                                      <div className="flex items-center gap-2">
                                        <ExternalLink className="w-3 h-3 text-gray-400" />
                                        <a 
                                          href={place.website} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                          Website
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-600">
                                    <div className="flex items-center gap-1 mb-1">
                                      <MapPin className="w-3 h-3 text-gray-400" />
                                      <span className="font-medium">{place.city}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {place.state}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  {place.permanentlyClosed ? (
                                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-lg text-xs font-medium">
                                      Permanently Closed
                                    </span>
                                  ) : place.temporarilyClosed ? (
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg text-xs font-medium">
                                      Temporarily Closed
                                    </span>
                                  ) : (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs font-medium">
                                      Open
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination */}
                    {(() => {
                      const sortedData = getSortedAndFilteredPlaces(response.data);
                      const totalPages = Math.ceil(sortedData.length / itemsPerPage);
                      
                      if (totalPages <= 1) return null;
                      
                      return (
                        <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} results
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2 text-sm font-medium text-gray-700">
                              Page {currentPage} of {totalPages}
                            </span>
                            <button
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : response ? (
                <div className="space-y-6">
                  {/* Table Controls */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h4 className="text-lg font-semibold text-gray-800">
                        {Array.isArray(response.data) ? response.data.length : 1} Business{Array.isArray(response.data) && response.data.length !== 1 ? 'es' : ''} Found
                      </h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Filter businesses..."
                          value={filterText}
                          onChange={(e) => {
                            setFilterText(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="pl-10 pr-4 py-2 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        />
                      </div>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-3 py-2 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      >
                        <option value={10}>10 entries</option>
                        <option value={50}>50 entries</option>
                        <option value={100}>100 entries</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Professional Data Table */}
                  <div className="bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4 text-left">
                              <span className="font-semibold text-gray-700">Business Name</span>
                            </th>
                            <th className="px-6 py-4 text-left">
                              <span className="font-semibold text-gray-700">Category</span>
                            </th>
                            <th className="px-6 py-4 text-left">
                              <span className="font-semibold text-gray-700">Rating</span>
                            </th>
                            <th className="px-6 py-4 text-left">
                              <span className="font-semibold text-gray-700">Reviews</span>
                            </th>
                            <th className="px-6 py-4 text-left">
                              <span className="font-semibold text-gray-700">Location</span>
                            </th>
                            <th className="px-6 py-4 text-left">Contact</th>
                            <th className="px-6 py-4 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(() => {
                            const dataArray = Array.isArray(response.data) ? response.data : [response.data];
                            
                            return dataArray.map((place, index) => (
                              <tr key={index} className="hover:bg-white/40 transition-colors duration-200">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    {place.imageUrl && (
                                      <img 
                                        src={place.imageUrl} 
                                        alt={place.title || 'Business'}
                                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 shadow-sm"
                                      />
                                    )}
                                    <div>
                                      <div className="font-semibold text-gray-900 leading-tight">
                                        {place.title || place.name || 'Business Name'}
                                      </div>
                                      {place.subTitle && (
                                        <div className="text-sm text-gray-500 mt-1">
                                          {place.subTitle}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium">
                                    {place.categoryName || place.category || 'Business'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {place.totalScore || place.rating ? (
                                    <div className="flex items-center gap-1">
                                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                      <span className="font-semibold text-gray-900">{place.totalScore || place.rating}</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">No rating</span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-gray-700 font-medium">
                                    {place.reviewsCount || place.reviews || 0}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="space-y-1">
                                    {place.phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-3 h-3 text-gray-400" />
                                        <a href={`tel:${place.phone}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                          {place.phone}
                                        </a>
                                      </div>
                                    )}
                                    {place.website && (
                                      <div className="flex items-center gap-2">
                                        <ExternalLink className="w-3 h-3 text-gray-400" />
                                        <a 
                                          href={place.website} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                          Website
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-600">
                                    <div className="flex items-center gap-1 mb-1">
                                      <MapPin className="w-3 h-3 text-gray-400" />
                                      <span className="font-medium">{place.city || place.location || 'N/A'}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {place.state || place.region || ''}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  {place.permanentlyClosed ? (
                                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-lg text-xs font-medium">
                                      Permanently Closed
                                    </span>
                                  ) : place.temporarilyClosed ? (
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg text-xs font-medium">
                                      Temporarily Closed
                                    </span>
                                  ) : (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs font-medium">
                                      Open
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center animate-pulse-slow">
                    <Building2 className="w-12 h-12 text-blue-500" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">Ready to Research</h4>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Enter your target location and business category to discover comprehensive market insights and generate qualified leads.
                  </p>
                  
                  {/* Sample searches */}
                  <div className="mt-8 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Popular Searches:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {[
                        { location: 'New York, NY', term: 'restaurants' },
                        { location: 'London, UK', term: 'gyms' },
                        { location: 'San Francisco, CA', term: 'startups' }
                      ].map(({ location: loc, term }) => (
                        <button
                          key={`${loc}-${term}`}
                          onClick={() => {
                            setLocation(loc);
                            setSearchTerm(term);
                          }}
                          className="text-xs bg-white/40 hover:bg-white/60 px-3 py-1 rounded-full border border-white/30 transition-all duration-200"
                        >
                          {term} in {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <div className="glass-card rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">Market Intelligence</h4>
                <p className="text-sm text-gray-600">Get comprehensive insights into local business landscapes</p>
              </div>
              <div className="text-center">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">Lead Generation</h4>
                <p className="text-sm text-gray-600">Build qualified prospect lists for your clients</p>
              </div>
              <div className="text-center">
                <Zap className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">Real-time Data</h4>
                <p className="text-sm text-gray-600">Access up-to-date business information instantly</p>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                © 2025 PlaceScout Pro. Professional local business intelligence platform for freelancers and agencies.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;