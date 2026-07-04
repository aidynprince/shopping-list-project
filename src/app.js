import { Store } from './store.js';
import { Toast } from './toast.js';

const CATEGORIES = [
  { id: 'produce', label: 'Produce' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'meat', label: 'Meat' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'frozen', label: 'Frozen' },
  { id: 'pantry', label: 'Pantry' },
  { id: 'household', label: 'Household' },
  { id: 'other', label: 'Other' },
];

export class ShoppingList {
  constructor() {
    this.store = new Store();
    this.toast = new Toast();

    this.isEditMode = false;
    this.editId = null;
    this.filterQuery = '';
    this.sortKey = 'created';
    this.dragSource = null;
    this.dragTarget = null;

    this.cacheDOM();
    this.bindEvents();
    this.render();
  }

  cacheDOM() {
    this.form = document.getElementById('item-form');
    this.input = document.getElementById('item-input');
    this.quantityInput = document.getElementById('item-quantity');
    this.categorySelect = document.getElementById('item-category');
    this.submitBtn = this.form.querySelector('.btn');
    this.btnText = this.submitBtn.querySelector('.btn-text');
    this.btnIcon = this.submitBtn.querySelector('i');
    this.list = document.getElementById('item-list');
    this.emptyState = document.getElementById('empty-state');
    this.filterInput = document.getElementById('filter');
    this.filterClear = document.getElementById('filter-clear');
    this.sortSelect = document.getElementById('sort-by');
    this.clearBtn = document.getElementById('clear');
    this.exportBtn = document.getElementById('export-btn');
    this.exportMenu = document.getElementById('export-menu');
    this.importBtn = document.getElementById('import-btn');
    this.importFile = document.getElementById('import-file');
    this.statsBadge = document.getElementById('stats');
    this.itemCount = document.getElementById('item-count');
  }

  bindEvents() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.list.addEventListener('click', (e) => this.handleListClick(e));
    this.list.addEventListener('dragstart', (e) => this.handleDragStart(e));
    this.list.addEventListener('dragend', (e) => this.handleDragEnd(e));
    this.list.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.list.addEventListener('dragenter', (e) => this.handleDragEnter(e));
    this.list.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.list.addEventListener('drop', (e) => this.handleDrop(e));
    this.filterInput.addEventListener('input', () => this.handleFilterChange());
    this.filterClear.addEventListener('click', () => this.clearFilter());
    this.sortSelect.addEventListener('change', () => {
      this.sortKey = this.sortSelect.value;
      this.render();
    });
    this.clearBtn.addEventListener('click', () => this.handleClearAll());
    this.exportBtn.addEventListener('click', () => this.toggleExportMenu());
    this.exportMenu.addEventListener('click', (e) => {
      const opt = e.target.closest('.export-option');
      if (!opt) return;
      this.handleExport(opt.dataset.format);
      this.closeExportMenu();
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.export-dropdown')) this.closeExportMenu();
    });
    this.importBtn.addEventListener('click', () => this.importFile.click());
    this.importFile.addEventListener('change', (e) => this.handleImport(e));
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  /* ---------- Data ---------- */

  getFilteredItems() {
    let items = this.store.getAll();
    if (this.filterQuery) {
      const q = this.filterQuery.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    switch (this.sortKey) {
      case 'name':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'category': {
        const order = CATEGORIES.map((c) => c.id);
        items.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
        break;
      }
      case 'purchased':
        items.sort((a, b) => Number(a.purchased) - Number(b.purchased));
        break;
      case 'created':
      default:
        items.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }
    return items;
  }

  /* ---------- Render ---------- */

  render() {
    const items = this.getFilteredItems();
    this.list.innerHTML = '';

    if (items.length === 0) {
      this.emptyState.classList.add('visible');
    } else {
      this.emptyState.classList.remove('visible');
    }

    items.forEach((item) => {
      const li = this.createItemElement(item);
      this.list.appendChild(li);
    });

    this.updateStats();
  }

  createItemElement(item) {
    const li = document.createElement('li');
    li.className = `item${item.purchased ? ' purchased' : ''}`;
    li.draggable = true;
    li.dataset.id = item.id;

    const cat = CATEGORIES.find((c) => c.id === item.category) || CATEGORIES[CATEGORIES.length - 1];

    li.innerHTML = `
      <div class="item-left">
        <input type="checkbox" class="item-checkbox" ${item.purchased ? 'checked' : ''} aria-label="Mark ${this.escapeHtml(item.name)} as purchased" />
        <div class="item-content">
          <span class="item-name">${this.highlightText(this.escapeHtml(item.name), this.filterQuery)}</span>
          ${item.quantity > 1 ? `<span class="item-quantity">&times;${item.quantity}</span>` : ''}
          <span class="item-category" data-category="${cat.id}">${cat.label}</span>
        </div>
      </div>
      <div class="item-actions">
        <button class="btn-icon edit-btn" title="Edit item" aria-label="Edit ${this.escapeHtml(item.name)}">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn-icon delete-btn" title="Delete item" aria-label="Delete ${this.escapeHtml(item.name)}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;

    return li;
  }

  updateStats() {
    const all = this.store.getAll();
    const purchased = all.filter((i) => i.purchased).length;
    const pending = all.length - purchased;

    this.statsBadge.textContent = all.length === 0 ? '0 items' : `${all.length} item${all.length !== 1 ? 's' : ''}`;
    this.itemCount.textContent = `${pending} pending` + (purchased > 0 ? `, ${purchased} done` : '');
  }

  /* ---------- Submit (Add / Update) ---------- */

  handleSubmit(e) {
    e.preventDefault();
    const name = this.input.value.trim();
    if (!name) {
      this.toast.error('Please enter an item name');
      this.input.focus();
      return;
    }

    if (this.store.getAll().some((i) => i.name.toLowerCase() === name.toLowerCase() && i.id !== this.editId)) {
      this.toast.error('This item already exists');
      return;
    }

    const quantity = parseInt(this.quantityInput.value, 10) || 1;
    const category = this.categorySelect.value;

    if (this.isEditMode && this.editId) {
      this.store.update(this.editId, { name, quantity, category });
      this.toast.success(`Updated "${name}"`);
      this.cancelEdit();
    } else {
      this.store.add({ name, quantity, category });
      this.toast.success(`Added "${name}"`);
      this.input.value = '';
      this.quantityInput.value = '1';
      this.categorySelect.value = 'other';
    }

    this.render();
    this.input.focus();
  }

  /* ---------- List Click ---------- */

  handleListClick(e) {
    const li = e.target.closest('.item');
    if (!li) return;
    const id = li.dataset.id;

    if (e.target.closest('.delete-btn')) {
      this.deleteItem(id, li);
      return;
    }

    if (e.target.closest('.edit-btn')) {
      this.startEdit(id);
      return;
    }

    if (e.target.closest('.item-checkbox')) {
      this.togglePurchased(id);
      return;
    }
  }

  /* ---------- Delete ---------- */

  deleteItem(id, li) {
    const item = this.store.getById(id);
    if (!item) return;

    li.classList.add('removing');
    li.addEventListener('animationend', () => {
      this.store.remove(id);
      if (this.editId === id) this.cancelEdit();
      this.render();
      this.toast.info(`Deleted "${item.name}"`, {
        actionLabel: 'Undo',
        duration: 5000,
        action: () => {
          this.store.add({ name: item.name, category: item.category, quantity: item.quantity });
          if (item.purchased) {
            const all = this.store.getAll();
            const added = all[all.length - 1];
            if (added) this.store.update(added.id, { purchased: true });
          }
          this.render();
          this.toast.success('Item restored');
        },
      });
    }, { once: true });
  }

  /* ---------- Toggle Purchased ---------- */

  togglePurchased(id) {
    const item = this.store.togglePurchased(id);
    if (!item) return;
    const label = item.purchased ? 'checked off' : 'unchecked';
    this.toast.info(`"${item.name}" ${label}`);
    this.render();
  }

  /* ---------- Edit ---------- */

  startEdit(id) {
    const item = this.store.getById(id);
    if (!item) return;

    this.isEditMode = true;
    this.editId = id;

    this.input.value = item.name;
    this.quantityInput.value = item.quantity;
    this.categorySelect.value = item.category;

    this.btnIcon.className = 'fa-solid fa-pen';
    this.btnText.textContent = 'Update Item';
    this.submitBtn.style.background = 'linear-gradient(135deg, #00b894, #00a381)';

    this.input.focus();
    this.input.select();
  }

  cancelEdit() {
    this.isEditMode = false;
    this.editId = null;
    this.input.value = '';
    this.quantityInput.value = '1';
    this.categorySelect.value = 'other';
    this.btnIcon.className = 'fa-solid fa-plus';
    this.btnText.textContent = 'Add Item';
    this.submitBtn.style.background = '';
  }

  /* ---------- Filter ---------- */

  handleFilterChange() {
    this.filterQuery = this.filterInput.value;
    this.filterClear.classList.toggle('visible', this.filterQuery.length > 0);
    this.render();
  }

  clearFilter() {
    this.filterInput.value = '';
    this.filterQuery = '';
    this.filterClear.classList.remove('visible');
    this.render();
    this.filterInput.focus();
  }

  /* ---------- Drag & Drop ---------- */

  handleDragStart(e) {
    const li = e.target.closest('.item');
    if (!li) return;
    this.dragSource = li;
    li.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', li.dataset.id);
  }

  handleDragEnd(e) {
    const li = e.target.closest('.item');
    if (li) li.classList.remove('dragging');
    document.querySelectorAll('.item.drag-over').forEach((el) => el.classList.remove('drag-over'));
    this.dragSource = null;
    this.dragTarget = null;
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  handleDragEnter(e) {
    const li = e.target.closest('.item');
    if (!li || li === this.dragSource) return;
    li.classList.add('drag-over');
    this.dragTarget = li;
  }

  handleDragLeave(e) {
    const li = e.target.closest('.item');
    if (!li) return;
    li.classList.remove('drag-over');
  }

  handleDrop(e) {
    e.preventDefault();
    const target = this.dragTarget;
    if (!target || !this.dragSource || target === this.dragSource) return;

    const fromId = this.dragSource.dataset.id;
    const toId = target.dataset.id;
    const all = this.store.getAll();
    const fromIdx = all.findIndex((i) => i.id === fromId);
    const toIdx = all.findIndex((i) => i.id === toId);

    if (fromIdx !== -1 && toIdx !== -1) {
      this.store.reorder(fromIdx, toIdx);
      this.render();
    }

    target.classList.remove('drag-over');
    this.dragSource = null;
    this.dragTarget = null;
  }

  /* ---------- Clear All ---------- */

  handleClearAll() {
    const count = this.store.getAll().length;
    if (count === 0) {
      this.toast.info('List is already empty');
      return;
    }
    const snapshot = this.store.exportData();
    this.store.clear();
    this.render();
    this.cancelEdit();
    this.toast.info(`Cleared ${count} item${count !== 1 ? 's' : ''}`, {
      actionLabel: 'Undo',
      duration: 6000,
      action: () => {
        this.store.importData(JSON.parse(snapshot));
        this.render();
        this.toast.success('List restored');
      },
    });
  }

  /* ---------- Export / Import ---------- */

  toggleExportMenu() {
    this.exportMenu.classList.toggle('open');
  }

  closeExportMenu() {
    this.exportMenu.classList.remove('open');
  }

  handleExport(format) {
    const date = new Date().toISOString().slice(0, 10);
    if (format === 'csv') {
      const rows = [['name', 'quantity', 'category', 'purchased']];
      this.store.getAll().forEach((i) => {
        rows.push([
          this.csvEscape(i.name),
          String(i.quantity),
          i.category,
          i.purchased ? 'true' : 'false',
        ]);
      });
      const csv = rows.map((r) => r.join(',')).join('\r\n');
      const bom = '\uFEFF';
      const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
      this.downloadBlob(blob, `shopping-list-${date}.csv`);
      this.toast.success('List exported as CSV');
    } else {
      const data = this.store.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      this.downloadBlob(blob, `shopping-list-${date}.json`);
      this.toast.success('List exported as JSON');
    }
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  csvEscape(value) {
    if (/[,"\n\r]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        if (file.name.endsWith('.csv')) {
          this.importCSV(text);
        } else {
          this.importJSON(text);
        }
      } catch {
        this.toast.error('Failed to import. Check file format.');
      }
    };
    reader.readAsText(file);
    this.importFile.value = '';
  }

  importJSON(text) {
    const data = JSON.parse(text);
    if (!this.store.importData(data)) throw new Error('Invalid format');
    this.render();
    this.toast.success(`Imported ${data.length} item${data.length !== 1 ? 's' : ''} from JSON`);
  }

  importCSV(text) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      this.toast.error('CSV must have a header row and at least one item');
      return;
    }

    const headers = this.parseCSVRow(lines[0]).map((h) => h.trim().toLowerCase());
    const nameIdx = headers.indexOf('name');
    const qtyIdx = headers.indexOf('quantity');
    const catIdx = headers.indexOf('category');
    const purIdx = headers.indexOf('purchased');

    if (nameIdx === -1) {
      this.toast.error('CSV must have a "name" column');
      return;
    }

    const imported = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCSVRow(lines[i]);
      if (!cols[nameIdx] || !cols[nameIdx].trim()) continue;
      imported.push({
        name: cols[nameIdx].trim(),
        quantity: qtyIdx !== -1 ? Math.max(1, parseInt(cols[qtyIdx], 10) || 1) : 1,
        category: catIdx !== -1 ? cols[catIdx].trim().toLowerCase() : 'other',
        purchased: purIdx !== -1 ? cols[purIdx].trim().toLowerCase() === 'true' : false,
        createdAt: Date.now(),
      });
    }

    if (imported.length === 0) {
      this.toast.error('No valid items found in CSV');
      return;
    }

    this.store.importData(imported);
    this.render();
    this.toast.success(`Imported ${imported.length} item${imported.length !== 1 ? 's' : ''} from CSV`);
  }

  parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < row.length && row[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          result.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current);
    return result;
  }

  /* ---------- Keyboard ---------- */

  handleKeyboard(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'n') {
        e.preventDefault();
        this.input.focus();
      }
      if (e.key === 'f') {
        e.preventDefault();
        this.filterInput.focus();
      }
    }
    if (e.key === 'Escape') {
      if (this.filterInput === document.activeElement) {
        this.clearFilter();
        e.preventDefault();
      } else if (this.input === document.activeElement && this.isEditMode) {
        this.cancelEdit();
        this.render();
        e.preventDefault();
      } else if (this.input === document.activeElement) {
        this.input.blur();
      }
    }
  }

  /* ---------- Utilities ---------- */

  highlightText(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
