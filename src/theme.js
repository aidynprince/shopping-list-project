const THEME_KEY = 'shopping-list-theme';

export class Theme {
  constructor() {
    this.toggleBtn = document.getElementById('theme-toggle');
    this.icon = this.toggleBtn.querySelector('i');
    this.current = this.load();
    this.apply(this.current);
    this.bind();
  }

  load() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  save(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.current = theme;
    this.icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }

  toggle() {
    const next = this.current === 'dark' ? 'light' : 'dark';
    this.apply(next);
    this.save(next);
  }

  bind() {
    this.toggleBtn.addEventListener('click', () => this.toggle());
  }
}
