import { useState, useEffect } from "react";
import { Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EventParticipant } from "@/hooks/use-live-events";

interface ParticipantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  getParticipants: (eventId: string) => Promise<EventParticipant[]>;
  onUpdateStatus: (participantId: string, eventId: string, status: "accepted" | "declined") => Promise<boolean>;
}

export function ParticipantsDialog({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  getParticipants,
  onUpdateStatus,
}: ParticipantsDialogProps) {
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (open && eventId) {
      setLoading(true);
      getParticipants(eventId).then((data) => {
        setParticipants(data);
        setLoading(false);
      });
    }
  }, [open, eventId, getParticipants]);

  const handleUpdateStatus = async (participantId: string, status: "accepted" | "declined") => {
    setUpdating(participantId);
    const success = await onUpdateStatus(participantId, eventId, status);
    if (success) {
      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, status } : p))
      );
    }
    setUpdating(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-500">Accepted</Badge>;
      case "declined":
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Participants - {eventTitle}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No registrations yet
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={participant.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {participant.profile?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {participant.profile?.full_name || "Unknown User"}
                      </p>
                      <div className="mt-1">{getStatusBadge(participant.status)}</div>
                    </div>
                  </div>

                  {participant.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-green-600 hover:bg-green-50"
                        onClick={() => handleUpdateStatus(participant.id, "accepted")}
                        disabled={updating === participant.id}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                        onClick={() => handleUpdateStatus(participant.id, "declined")}
                        disabled={updating === participant.id}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
