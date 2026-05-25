import { create } from 'zustand'

interface NotificationStore {
  notifications: unknown[]
  unreadCount: number

  setNotifications: (newNotifications: unknown[]) => void
  incrementUnread: () => void
  resetUnread: () => void
}

export const useNotificationStore = create<NotificationStore>(function (set) {
  return {
    notifications: [],
    unreadCount: 0,

    setNotifications: function (newNotifications) {
      set({ notifications: newNotifications })
    },
    incrementUnread: function () {
      set(function (state) {
        return { unreadCount: state.unreadCount + 1 }
      })
    },
    resetUnread: function () {
      set({ unreadCount: 0 })
    },
  }
})
