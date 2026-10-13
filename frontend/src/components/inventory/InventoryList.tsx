import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  ArrowUpRight, 
  SlidersHorizontal, 
  Eye, 
  Layers, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  X,
  ChevronDown,
  Tag
} from 'lucide-react';
import { InventoryStore } from '../../services/inventoryStore';
import { InventoryItem, IndividualAsset } from '../../types/inventory';
import { ItemFormModal } from './ItemFormModal';
import { PageId } from '../layout/Sidebar';

interface InventoryListProps {
  onNavigate: (page: PageId) => void;
  onPreselectIssueItem?: (itemId: string) => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({
  onNavigate,
  onPreselectIssueItem,
}) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [trackingFilter, setTrackingFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedAssetItem, setSelectedAssetItem] = useState<InventoryItem | null>(null);

  const loadData = () => {
    setItems(InventoryStore.getItems());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('inventory-store-updated', loadData);
    return () => window.removeEventListener('inventory-store-updated', loadData);
  }, []);

  const categories = ['ALL', ...Array.from(new Set(items.map(i => i.category)))];

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.makeModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesTracking = trackingFilter === 'ALL' || item.trackingType === trackingFilter;

    return matchesSearch && matchesCategory && matchesTracking;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">Department Inventory Catalog</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700">
              {filteredItems.length} of {items.length} items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maintain laboratory records, track individual asset IDs & quantity-based reusable items.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Inventory Item</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by item name, code (e.g. DB-STM32), make/model, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <select
            value={trackingFilter}
            onChange={(e) => setTrackingFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
          >
            <option value="ALL">All Tracking Types</option>
            <option value="INDIVIDUAL_ASSET">Individually Tracked Assets</option>
            <option value="QUANTITY_REUSABLE">Quantity-Based Reusables</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Item Code & Name</th>
                <th className="py-3 px-4">Category / Model</th>
                <th className="py-3 px-4">Tracking Type</th>
                <th className="py-3 px-4 text-center">Total</th>
                <th className="py-3 px-4 text-center">Available</th>
                <th className="py-3 px-4 text-center">Issued</th>
                <th className="py-3 px-4 text-center">Dmg / Maint</th>
                <th className="py-3 px-4">Storage Location</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No inventory items matched your criteria</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try clearing the search query or category filters.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Item Code & Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 text-xs">
                        {item.name}
                      </div>
                      <div className="text-[11px] font-mono text-blue-600 font-medium mt-0.5">
                        {item.itemCode}
                      </div>
                    </td>

                    {/* Category / Model */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-medium text-slate-700">{item.category}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {item.makeModel || 'Standard department issue'}
                      </div>
                    </td>

                    {/* Tracking Type */}
                    <td className="py-3.5 px-4">
                      {item.trackingType === 'INDIVIDUAL_ASSET' ? (
                        <button
                          onClick={() => setSelectedAssetItem(item)}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                          title="Click to view all asset IDs"
                        >
                          <Tag className="w-3 h-3" />
                          <span>Asset Tracked ({item.individualAssets?.length || item.totalQuantity})</span>
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Quantity Pooled
                        </span>
                      )}
                    </td>

                    {/* Quantities */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {item.totalQuantity}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        item.availableQuantity > 0 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {item.availableQuantity}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold text-blue-700">
                      {item.issuedQuantity > 0 ? (
                        <span className="bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-200">
                          {item.issuedQuantity}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold">
                      {(item.damagedQuantity || 0) + (item.maintenanceQuantity || 0) > 0 ? (
                        <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-xs border border-rose-200">
                          {(item.damagedQuantity || 0) + (item.maintenanceQuantity || 0)}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>

                    {/* Storage Location */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px]" title={item.location}>
                          {item.location}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.availableQuantity > 0 && (
                          <button
                            onClick={() => {
                              onPreselectIssueItem?.(item.id);
                              onNavigate('issue');
                            }}
                            className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                            title="Issue to student"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Issue</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setIsModalOpen(true);
                          }}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="Edit Item Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={() => onNavigate('stock-adjust')}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="Adjust Stock or Flag Damage"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Inspection Modal (For Individually Tracked Items) */}
      {selectedAssetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-[11px] font-mono text-blue-600 font-bold uppercase">
                  {selectedAssetItem.itemCode}
                </span>
                <h3 className="text-base font-bold text-slate-800">
                  {selectedAssetItem.name} — Individual Asset Roster
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mandatory Asset ID Tracking • Single Borrower Enforcement (Rule 4)
                </p>
              </div>
              <button
                onClick={() => setSelectedAssetItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {selectedAssetItem.individualAssets && selectedAssetItem.individualAssets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedAssetItem.individualAssets.map((asset) => (
                    <div 
                      key={asset.id} 
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between text-xs"
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <span className="font-mono font-bold text-sm text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {asset.assetId}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          asset.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                          asset.status === 'ISSUED' ? 'bg-blue-100 text-blue-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {asset.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        <div>Location: <strong className="text-slate-700">{asset.location}</strong></div>
                        <div>Condition: <strong className="text-slate-700">{asset.condition}</strong></div>
                        {asset.serialNumber && <div>Serial: <span className="font-mono">{asset.serialNumber}</span></div>}
                        {asset.currentStudentId && (
                          <div className="text-blue-700 font-medium pt-1">
                            Issued to: Rahul Sharma (DFIS26001)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No individual asset records found.</p>
              )}
            </div>

            <div className="pt-4 mt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedAssetItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      <ItemFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        itemToEdit={editingItem}
        onSaved={loadData}
      />
    </div>
  );
};
