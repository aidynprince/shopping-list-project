const STORAGE_KEY = 'shopping-list-v2';
const LEGACY_KEY = 'items';

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function migrateLegacyData() {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return [];
    const oldItems = JSON.parse(legacy);
    if (!Array.isArray(oldItems)) return [];
    const migrated = oldItems.map((name) => ({
      id: generateId(),
      name: typeof name === 'string' ? name : String(name),
      category: 'other',
      quantity: 1,
      purchased: false,
      createdAt: Date.now(),
    }));
    localStorage.removeItem(LEGACY_KEY);
    return migrated;
  } catch {
    return [];
  }
}

export class Store {
  constructor() {
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.items = JSON.parse(raw);
      } else {
        this.items = migrateLegacyData();
      }
      if (!Array.isArray(this.items)) this.items = [];
    } catch {
      this.items = [];
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
  }

  getAll() {
    return [...this.items];
  }

  getById(id) {
    return this.items.find((i) => i.id === id) || null;
  }

  add({ name, category, quantity }) {
    const item = {
      id: generateId(),
      name: name.trim(),
      category: category || 'other',
      quantity: Math.max(1, parseInt(quantity, 10) || 1),
      purchased: false,
      createdAt: Date.now(),
    };
    this.items.push(item);
    this.save();
    return item;
  }

  update(id, changes) {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    this.items[idx] = { ...this.items[idx], ...changes };
    this.save();
    return this.items[idx];
  }

  remove(id) {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const [removed] = this.items.splice(idx, 1);
    this.save();
    return removed;
  }

  togglePurchased(id) {
    const item = this.getById(id);
    if (!item) return null;
    item.purchased = !item.purchased;
    this.save();
    return item;
  }

  reorder(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    const [moved] = this.items.splice(fromIndex, 1);
    this.items.splice(toIndex, 0, moved);
    this.save();
  }

  clear() {
    this.items = [];
    this.save();
  }

  importData(data) {
    if (!Array.isArray(data)) return false;
    this.items = data.map((item) => ({
      id: item.id || generateId(),
      name: String(item.name || ''),
      category: item.category || 'other',
      quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      purchased: Boolean(item.purchased),
      createdAt: item.createdAt || Date.now(),
    }));
    this.save();
    return true;
  }

  exportData() {
    return JSON.stringify(this.items, null, 2);
  }
}
