
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface VideoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
}

const VideoDialog = ({ isOpen, onOpenChange, videoId }: VideoDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-black">
        <div className="w-full h-[450px] relative">
          <iframe 
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0`}
            title="Flashbot Demo Video"
            className="absolute top-0 left-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoDialog;
