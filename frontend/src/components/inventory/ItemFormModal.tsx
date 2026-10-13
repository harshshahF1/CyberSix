import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Layers, Boxes, MapPin } from 'lucide-react';
import { InventoryItem, ItemTrackingType } from '../../types/inventory';
import { InventoryStore } from '../../services/inventoryStore';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: InventoryItem | null;
  onSaved: () => void;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  itemToEdit,
  onSaved,
}) => {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    itemCode: '',
    category: 'Development Boards',
    description: '',
    makeModel: '',
    trackingType: 'INDIVIDUAL_ASSET',
    totalQuantity: 1,
    location: 'Cyber Lab 102 - Cupboard B-1',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const locations = InventoryStore.getLocations();

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        id: itemToEdit.id,
        name: itemToEdit.name,
        itemCode: itemToEdit.itemCode,
        category: itemToEdit.category,
        description: itemToEdit.description,
        makeModel: itemToEdit.makeModel,
        trackingType: itemToEdit.trackingType,
        totalQuantity: itemToEdit.totalQuantity,
        location: itemToEdit.location,
      });
    } else {
      setFormData({
        name: '',
        itemCode: '',
        category: 'Development Boards',
        description: '',
        makeModel: '',
        trackingType: 'INDIVIDUAL_ASSET',
        totalQuantity: 1,
        location: 'Cyber Lab 102 - Cupboard B-1',
      });
    }
    setErrorMsg(null);
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setErrorMsg('Item name is required.');
      return;
    }
    if (!formData.itemCode?.trim()) {
      setErrorMsg('Item code is required (e.g. DB-STM32-01).');
      return;
    }
    if (!formData.totalQuantity || formData.totalQuantity <= 0) {
      setErrorMsg('Total quantity must be at least 1.');
      return;
    }

    const res = InventoryStore.saveItem(formData);
    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {itemToEdit ? 'Edit Inventory Item' : 'Register New Inventory Item'}
              </h2>
              <p className="text-xs text-slate-500">
                M.Sc. DFIS Laboratory Hardware Catalog
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Item Code / Catalog Number *
              </label>
              <input
                type="text"
                placeholder="e.g. DB-STM32-ARM"
                value={formData.itemCode}
                onChange={(e) => setFormData({ ...formData, itemCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Development Boards">Development Boards</option>
                <option value="Cables & Adapters">Cables & Adapters</option>
                <option value="Test & Measurement">Test & Measurement</option>
                <option value="Security Tokens">Security Tokens</option>
                <option value="Forensic Workstations">Forensic Workstations</option>
                <option value="Storage & Accessories">Storage & Accessories</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              placeholder="e.g. STM32 ARM Cortex Development Board"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Make / Manufacturer / Model
              </label>
              <input
                type="text"
                placeholder="e.g. STMicroelectronics NUCLEO-F446RE"
                value={formData.makeModel}
                onChange={(e) => setFormData({ ...formData, makeModel: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Storage Location *
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Cyber Lab 102 - Cupboard B-1">Cyber Lab 102 - Cupboard B-1</option>
                <option value="Embedded & Forensics Lab - Cupboard A-2">Embedded & Forensics Lab - Cupboard A-2</option>
                <option value="Hardware Lab 104 - Shelf C">Hardware Lab 104 - Shelf C</option>
                <option value="Department Secure Vault - Forensics Safe">Department Secure Vault - Forensics Safe</option>
                <option value="Room 105 - Storage Cabinet 1">Room 105 - Storage Cabinet 1</option>
              </select>
            </div>
          </div>

          {/* Tracking Type Distinction (Mandatory Policy Rule) */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tracking Paradigm (Mandatory Problem Spec) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-start gap-2 transition-all ${
                formData.trackingType === 'INDIVIDUAL_ASSET'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-medium'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="trackingType"
                  value="INDIVIDUAL_ASSET"
                  checked={formData.trackingType === 'INDIVIDUAL_ASSET'}
                  onChange={() => setFormData({ ...formData, trackingType: 'INDIVIDUAL_ASSET' })}
                  disabled={!!itemToEdit}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <div className="font-semibold">Individually Tracked Asset</div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    For high-value items like dev boards or analyzers. Generates unique Asset IDs (e.g. DB-001, DB-002) with single-borrower restrictions.
                  </p>
                </div>
              </label>

              <label className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-start gap-2 transition-all ${
                formData.trackingType === 'QUANTITY_REUSABLE'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-medium'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="trackingType"
                  value="QUANTITY_REUSABLE"
                  checked={formData.trackingType === 'QUANTITY_REUSABLE'}
                  onChange={() => setFormData({ ...formData, trackingType: 'QUANTITY_REUSABLE' })}
                  disabled={!!itemToEdit}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <div className="font-semibold">Quantity-Based Reusable Item</div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    For interchangeable items like USB cables or serial adapters. Tracked as total pooled quantities with partial return support.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Total Quantity {itemToEdit ? '(Use Stock Adjustments page to change existing count)' : '*'}
            </label>
            <input
              type="number"
              min="1"
              value={formData.totalQuantity}
              disabled={!!itemToEdit}
              onChange={(e) => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Specifications
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Embedded development boards equipped with ARM Cortex-M4 microcontroller for laboratory experiments."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{itemToEdit ? 'Save Changes' : 'Create Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
