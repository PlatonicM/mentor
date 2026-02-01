import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  Info,
  CheckCircle,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { useNotifications, Notification } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, ReactNode> = {
  event: <Calendar className="w-4 h-4 text-primary" />,
  success: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  info: <Info className="w-4 h-4 text-sky-500" />,
};

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const item = (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "p-3 border-b last:border-b-0 cursor-pointer",
        !notification.is_read && "bg-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {typeIcons[notification.type] || typeIcons.info}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">
              {notification.title}
            </p>
            {!notification.is_read && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.message}
          </p>

          <p className="text-[11px] text-muted-foreground mt-1">
            {formatDistanceToNow(
              new Date(notification.created_at),
              { addSuffix: true }
            )}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
            >
              <Check className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(notification.id);
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );

  return notification.link ? (
    <Link to={notification.link}>{item}</Link>
  ) : (
    item
  );
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <motion.div
            animate={
              unreadCount > 0
                ? { rotate: [0, -10, 10, -10, 0] }
                : {}
            }
            transition={{ duration: 0.6 }}
          >
            <Bell className="w-5 h-5" />
          </motion.div>

          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0 overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={markAllAsRead}
              >
                <CheckCheck className="w-3 h-3" />
                Mark all
              </Button>
            )}
          </div>

          {/* Content */}
          <ScrollArea className="h-[300px]">
            <AnimatePresence>
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center py-10"
                >
                  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
                </motion.div>
              ) : notifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-10 text-center"
                >
                  <Bell className="mx-auto mb-2 w-10 h-10 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    No notifications
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You’re all caught up 🎉
                  </p>
                </motion.div>
              ) : (
                notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))
              )}
            </AnimatePresence>
          </ScrollArea>

          <Separator />

          {/* Footer */}
          <div className="p-2">
            <Link
              to="/settings/notifications"
              onClick={() => setOpen(false)}
            >
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Settings className="w-4 h-4" />
                Notification Settings
              </Button>
            </Link>
          </div>
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
