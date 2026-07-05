export class ThemeToggle {
  isDark = document.documentElement.classList.contains('dark')

  toggle(): void {
    this.isDark = !this.isDark
    document.documentElement.classList.toggle('dark', this.isDark)
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light')
  }
}
