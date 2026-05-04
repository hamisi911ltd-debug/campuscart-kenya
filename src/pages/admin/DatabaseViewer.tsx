import { useState, useEffect } from "react";
import { 
  Database, Table, Search, Download, Trash2, Eye,
  RefreshCw, AlertTriangle, CheckCircle, FileText
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface TableInfo {
  name: string;
  count: number;
}

interface QueryResult {
  columns: string[];
  rows: any[];
}

const DatabaseViewer = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<QueryResult | null>(null);
  const [customQuery, setCustomQuery] = useState<string>('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/database-viewer?action=tables', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch tables');
      
      const data = await response.json();
      setTables(data.tables || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const viewTable = async (tableName: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/database-viewer?action=view&table=${encodeURIComponent(tableName)}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch table data');
      
      const data = await response.json();
      setTableData(data);
      setSelectedTable(tableName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch table data');
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async () => {
    if (!customQuery.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/database-viewer', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customQuery })
      });
      
      if (!response.ok) throw new Error('Query failed');
      
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setQueryResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const renderTable = (data: QueryResult) => {
    if (!data.columns || !data.rows) return null;

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              {data.columns.map((col, index) => (
                <th key={index} className="border border-gray-300 px-4 py-2 text-left font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {data.columns.map((col, colIndex) => (
                  <td key={colIndex} className="border border-gray-300 px-4 py-2 text-sm">
                    {String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                🗄️ Database Viewer
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Direct access to D1 database tables and custom queries
              </p>
            </div>
            
            <button 
              onClick={fetchTables}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Tables List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Table className="h-6 w-6 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tables</h2>
              </div>

              <div className="space-y-2">
                {tables.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => viewTable(table.name)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedTable === table.name
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{table.name}</div>
                    <div className="text-sm text-gray-500">{table.count} rows</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Query */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <Search className="h-6 w-6 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Custom Query</h2>
              </div>

              <div className="space-y-4">
                <textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="SELECT * FROM users LIMIT 10;"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                />
                
                <button
                  onClick={executeQuery}
                  disabled={loading || !customQuery.trim()}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  Execute Query
                </button>
              </div>
            </div>
          </div>

          {/* Data Display */}
          <div className="lg:col-span-3">
            {loading && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading data...</p>
              </div>
            )}

            {/* Table Data */}
            {tableData && !loading && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Table: {selectedTable} ({tableData.rows.length} rows)
                  </h3>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-600">Data loaded</span>
                  </div>
                </div>
                {renderTable(tableData)}
              </div>
            )}

            {/* Query Result */}
            {queryResult && !loading && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Query Result ({queryResult.rows.length} rows)
                  </h3>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-600">Query executed</span>
                  </div>
                </div>
                {renderTable(queryResult)}
              </div>
            )}

            {/* Empty State */}
            {!tableData && !queryResult && !loading && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Data Selected</h3>
                <p className="text-gray-500">
                  Select a table from the sidebar or run a custom query to view data
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DatabaseViewer;