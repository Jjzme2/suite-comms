const sidebarOpen = ref(false)

export const useSidebar = () => ({
  isOpen: sidebarOpen,
  open: () => { sidebarOpen.value = true },
  close: () => { sidebarOpen.value = false },
  toggle: () => { sidebarOpen.value = !sidebarOpen.value }
})
