import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, Download, Eye, Edit, Calendar, User, Loader2, AlertTriangle } from 'lucide-react';
// Minimal local Agreement type and hook (replace with your real hook when available)
export interface Agreement {
  id: string;
  type: string;
  leaseId?: string;
  farmerName?: string;
  lessorName?: string;
  plotName?: string;
  signedDate?: string;
  startDate?: string;
  endDate?: string;
  status?: 'draft' | 'active' | 'expired' | string;
  documentUrl?: string;
}

export const useAgreements = () => {
  const [agreements, setAgreements] = React.useState<Agreement[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAgreements = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Replace this with your real API call
      const res = await fetch('/api/agreements');
      if (!res.ok) throw new Error(`Failed to fetch agreements (${res.status})`);
      const data = await res.json();
      setAgreements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadAgreement = async (agreement: Agreement) => {
    if (!agreement.documentUrl) throw new Error('No document URL available');
    const res = await fetch(agreement.documentUrl);
    if (!res.ok) throw new Error('Failed to download document');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agreement.leaseId ?? agreement.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  return { agreements, loading, error, fetchAgreements, downloadAgreement };
};

interface DigitalAgreementsProps {
  onAgreementClick: (agreement: Agreement) => void;
}

export const DigitalAgreements: React.FC<DigitalAgreementsProps> = ({ onAgreementClick }) => {
  const { agreements, loading, error, fetchAgreements, downloadAgreement } = useAgreements();

  // Local status badge renderer (fallback if none passed via props)
  const getStatusBadge = (status?: string) => {
    const base = 'text-xs font-medium px-2 py-1 rounded';
    switch (status) {
      case 'active':
        return <span className={`${base} bg-green-100 text-green-800`}>Active</span>;
      case 'draft':
        return <span className={`${base} bg-yellow-100 text-yellow-800`}>Draft</span>;
      case 'expired':
        return <span className={`${base} bg-red-100 text-red-800`}>Expired</span>;
      default:
        return <span className={`${base} bg-gray-100 text-gray-800`}>{status ?? 'Unknown'}</span>;
    }
  };

  // Handle download action
  const handleDownload = async (agreement: Agreement, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    try {
      await downloadAgreement(agreement);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download document';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Digital Agreements</h2>
            <p className="text-gray-600">Manage and track all lease agreements</p>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Loading agreements...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Digital Agreements</h2>
            <p className="text-gray-600">Manage and track all lease agreements</p>
          </div>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={fetchAgreements}
          >
            <FileText className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h3 className="text-lg font-medium mb-2 text-red-600">Error Loading Agreements</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchAgreements} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Digital Agreements</h2>
          <p className="text-gray-600">Manage and track all lease agreements</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <FileText className="w-4 h-4 mr-2" />
          Create New Agreement
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {agreements.length} agreement{agreements.length !== 1 ? 's' : ''} found
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchAgreements}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <FileText className="w-4 h-4 mr-1" />
              Refresh
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4">
        {agreements.map((agreement: Agreement) => (
          <Card key={agreement.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onAgreementClick(agreement)}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {agreement.type}
                  </CardTitle>
                  <CardDescription>Lease ID: {agreement.leaseId}</CardDescription>
                </div>
                {getStatusBadge(agreement.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <span><strong>Farmer:</strong> {agreement.farmerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <span><strong>Lessor:</strong> {agreement.lessorName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span><strong>Plot:</strong> {agreement.plotName}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span><strong>Generated:</strong> {agreement.signedDate ? new Date(agreement.signedDate).toLocaleDateString() : '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span><strong>Start:</strong> {agreement.startDate ? new Date(agreement.startDate).toLocaleDateString() : '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span><strong>End:</strong> {agreement.endDate ? new Date(agreement.endDate).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAgreementClick(agreement);
                    }}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => handleDownload(agreement, e)}
                    disabled={!agreement.documentUrl}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                  {agreement.status === 'draft' && (
                    <Button variant="outline" size="sm">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {agreements.length === 0 && !loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Agreements Found</h3>
            <p className="text-gray-600 mb-4">Create your first lease agreement to get started</p>
            <div className="flex gap-2 justify-center">
              <Button className="bg-green-600 hover:bg-green-700">
                <FileText className="w-4 h-4 mr-2" />
                Create Agreement
              </Button>
              <Button variant="outline" onClick={fetchAgreements}>
                <FileText className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};