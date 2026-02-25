import { create } from "zustand";

// ─── Modal registry ──────────────────────────────────────────────────────────

export type ModalId =
  | "delete-session"
  | "delete-sessions-bulk"
  | "upgrade-plan"
  | "agent-config"
  | "job-apply"
  | "job-post"
  | "none";

interface ModalState {
  activeModal: ModalId;
  modalPayload: Record<string, unknown>;
}

interface ModalActions {
  openModal: (id: ModalId, payload?: Record<string, unknown>) => void;
  closeModal: () => void;
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

interface SidebarState {
  isSidebarOpen: boolean;
}

interface SidebarActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

// ─── Notifications / toasts ───────────────────────────────────────────────────

export type NotificationSeverity = "info" | "success" | "warning" | "error";

export interface AppNotification {
  id: string;
  message: string;
  severity: NotificationSeverity;
  /** Milliseconds until auto-dismiss. Omit for persistent. */
  duration?: number;
}

interface NotificationState {
  notifications: AppNotification[];
}

interface NotificationActions {
  addNotification: (
    notification: Omit<AppNotification, "id">
  ) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

// ─── Combined store ───────────────────────────────────────────────────────────

type UIStore = ModalState &
  ModalActions &
  SidebarState &
  SidebarActions &
  NotificationState &
  NotificationActions;

let _notifCounter = 0;

export const useUIStore = create<UIStore>((set) => ({
  // Modal
  activeModal: "none",
  modalPayload: {},
  openModal: (id, payload = {}) =>
    set({ activeModal: id, modalPayload: payload }),
  closeModal: () => set({ activeModal: "none", modalPayload: {} }),

  // Sidebar
  isSidebarOpen: true,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  // Notifications
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: `notif-${++_notifCounter}` },
      ],
    })),
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));

// ─── Convenience selectors ────────────────────────────────────────────────────

export const useActiveModal = () =>
  useUIStore((s) => ({ activeModal: s.activeModal, payload: s.modalPayload }));

export const useSidebar = () =>
  useUIStore((s) => ({
    isOpen: s.isSidebarOpen,
    toggle: s.toggleSidebar,
    setOpen: s.setSidebarOpen,
  }));

export const useNotifications = () =>
  useUIStore((s) => ({
    notifications: s.notifications,
    add: s.addNotification,
    dismiss: s.dismissNotification,
    clear: s.clearNotifications,
  }));
