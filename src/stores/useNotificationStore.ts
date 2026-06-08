import { create } from 'zustand'

export type AppNotification = {
  ID: number
  RecipientID: number
  ActorID: number
  Type: string
  EntityType: string
  EntityID: number
  ReadAt: string | null
  CreatedAt: string
}

interface NotificationStore {
  notifications: AppNotification[]
  unreadCount: number

  setNotifications: (newNotifications: AppNotification[]) => void
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
