import { create } from 'zustand'

interface WsStore {
    socket: WebSocket | null
    status: "connecting" | "open" | "closed"

    setSocket: (newSocket: WebSocket) => void
    setStatus: (newStatus: "connecting" | "open" | "closed") => void
}

export const useWsStore = create<WsStore>(function (set) {
    return {
        socket: null,
        status: "closed",

        setSocket: function (newSocket) {
            set({ socket: newSocket })
        },
        setStatus: function (newStatus) {
            set({ status: newStatus })
        }
    }
})