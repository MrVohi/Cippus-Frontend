import { create } from 'zustand'

interface User {
    id: number,
    username: string,
    bio: string,
    role: "user" | "moderator" | "admin",
    avatarUrl: string | null
}

export interface AuthStore {
    user: User | null
    token: string | null

    setUser: (newUser: User) => void
    setToken: (newToken: string) => void
    logout: () => void
}

export const useAuthStore = create<AuthStore>(function (set) {
    return {
        user: null,
        token: null,

        setUser: function (newUser) {
            set({ user: newUser })
        },
        setToken: function (newToken) {
            set({ token: newToken })
        },
        logout: function () {
            set({
                user: null,
                token: null,
            })
        }
    }
})