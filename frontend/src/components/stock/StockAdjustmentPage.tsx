import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  Plus, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  Clock, 
  Archive, 
  User, 
  Save,
  Tag
} from 'lucide-react';
import { InventoryStore } from '../../services/inventoryStore';
import { InventoryItem, StockAdjustmentRecord, StockAdjustmentType } from '../../types/inventory';
import { formatDisplayDate } from '../../utils/dateUtils';

export const StockAdjustmentPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustmentRecord[]>([]);
  const [systemDate, setSystemDate] = useState<string>('');

  // Form State
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<StockAdjustmentType>('NEW_STOCK');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [responsibleUser, setResponsibleUser] = useState('Dr. S. K. Mehta (Coordinator)');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = () => {
    setItems(InventoryStore.getItems());
    setAdjustments(InventoryStore.getAdjustments());
    setSystemDate(InventoryStore.getSystemDate());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('inventory-store-updated', loadData);
    window.addEventListener('inventory-system-date-changed', loadData);
    return () => {
      window.removeEventListener('inventory-store-updated', loadData);
      window.removeEventListener('inventory-system-date-changed', loadData);
    };
  }, []);

  const selectedItem = items.find(i => i.id === selectedItemId);

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedItemId) {
      setErrorMsg('Please select an inventory item.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Mandatory Rule 12: A documented reason and justification is required for all stock adjustments.');
      return;
    }

    const res = InventoryStore.adjustStock({
      itemId: selectedItemId,
      assetId: selectedAssetId || undefined,
      adjustmentType,
      quantity: Number(quantity),
      reason,
      responsibleUser,
    });

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    setSuccessMsg(res.message);
    setReason('');
    setSelectedAssetId('');
    setQuantity(1);
    loadData();
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-800">Stock Corrections, Maintenance & Retirement</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile physical counts, restore repaired hardware to usable status, or retire unrepairable equipment (Rule 10 & 12).
          </p>
        </div>

        <div className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
          <span>Logged Coordinator: <strong>{responsibleUser}</strong></span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Adjustment Form + Ledger Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card (1 Col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
            Apply Stock Modification
          </h2>

          <form onSubmit={handleApplyAdjustment} className="space-y-4 text-xs">
            {/* Target Item */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Target Inventory Item *
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  setSelectedAssetId('');
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 font-medium"
                required
              >
                <option value="">-- Choose Item --</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.itemCode}) — Avail: {i.availableQuantity} | Dmg: {i.damagedQuantity || 0}
                  </option>
                ))}
              </select>

              {selectedItem && (
                <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] grid grid-cols-3 gap-1 text-center">
                  <div>
                    <span className="text-slate-400 block">Total</span>
                    <strong className="text-slate-800">{selectedItem.totalQuantity}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Available</span>
                    <strong className="text-emerald-700">{selectedItem.availableQuantity}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Damaged/Maint</span>
                    <strong className="text-rose-700">{(selectedItem.damagedQuantity || 0) + (selectedItem.maintenanceQuantity || 0)}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* If Individual Asset: Pick Asset ID */}
            {selectedItem?.trackingType === 'INDIVIDUAL_ASSET' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span>Individual Asset ID (Optional for new stock)</span>
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                >
                  <option value="">-- Any / All Units --</option>
                  {selectedItem.individualAssets?.map((a) => (
                    <option key={a.id} value={a.assetId}>
                      Asset ID: {a.assetId} [{a.status} / {a.condition}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Adjustment Type */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Adjustment Type *
              </label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as StockAdjustmentType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800"
              >
                <option value="NEW_STOCK">Procurement: Add New Stock</option>
                <option value="CORRECTION_ADD">Audit Correction: Add Quantity (+)</option>
                <option value="CORRECTION_SUBTRACT">Audit Correction: Deduct Quantity (-)</option>
                <option value="DAMAGE_FLAG">Flag Usable Stock as Damaged</option>
                <option value="RESTORE_TO_USABLE">Restore Repaired Item to Usable Stock</option>
                <option value="RETIREMENT">Retire / Scrap Obsolete Hardware</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Quantity to Adjust *
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                required
              />
            </div>

            {/* Documented Reason */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mandatory Reason & Audit Justification (Rule 12) *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Received shipment of 5 additional units under Semester I Hardware Grant / Repaired solder joint on DB-003 and validated 3.3V rails."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            {/* Responsible Staff */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Responsible Coordinator *
              </label>
              <input
                type="text"
                value={responsibleUser}
                onChange={(e) => setResponsibleUser(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!selectedItemId}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Record Stock Adjustment</span>
            </button>
          </form>
        </div>

        {/* Audit Log Ledger (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800">
              Department Inventory Adjustment Ledger (Rule 12 Audit Trail)
            </h2>
            <p className="text-xs text-slate-500">
              Complete chronological audit trail of all manual adjustments, procurements, damage flags, and retirements.
            </p>
          </div>

          <div className="p-4 overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold">
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Item Affected</th>
                  <th className="pb-2">Adjustment Action</th>
                  <th className="pb-2 text-center">Qty</th>
                  <th className="pb-2">Reason / Justification</th>
                  <th className="pb-2">Responsible User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-50">
                    <td className="py-3 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                      {adj.timestamp}
                    </td>

                    <td className="py-3 font-semibold text-slate-800">
                      <div>{adj.itemName}</div>
                      {adj.assetId && (
                        <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {adj.assetId}
                        </span>
                      )}
                    </td>

                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        adj.adjustmentType === 'NEW_STOCK' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        adj.adjustmentType === 'RESTORE_TO_USABLE' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        adj.adjustmentType === 'DAMAGE_FLAG' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                        adj.adjustmentType === 'RETIREMENT' ? 'bg-slate-100 text-slate-700 border border-slate-300' :
                        'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}>
                        {adj.adjustmentType}
                      </span>
                    </td>

                    <td className="py-3 text-center font-bold text-slate-800">
                      {adj.quantity}
                    </td>

                    <td className="py-3 text-slate-600 text-[11px] max-w-xs leading-relaxed">
                      {adj.reason}
                    </td>

                    <td className="py-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {adj.responsibleUser}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
