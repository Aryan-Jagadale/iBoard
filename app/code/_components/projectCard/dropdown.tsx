"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleEllipsis, Globe, Lock, Trash2 } from "lucide-react";

export default function ProjectCardDropdown({
  virtualbox,
  onVisibilityChange,
  onDelete,
}: {
  virtualbox: any;
  onVisibilityChange: (virtualbox: any) => void;
  onDelete: (virtualbox: any) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="
      h-6 w-6 flex items-center justify-center transition-colors bg-transparent hover:bg-muted-foreground/25 rounded-sm"
      >
        <CircleEllipsis className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onVisibilityChange(virtualbox);
          }}
        >
          {virtualbox.visibility === "public" ? (
            <>
              <Lock className="mr-2 h-4 w-4" />
              <span>Make Private</span>
            </>
          ) : (
            <>
              <Globe className="mr-2 h-4 w-4" />
              <span>Make Public</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDelete(virtualbox);
          }}
          className="!text-destructive cursor-pointer"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Project</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}