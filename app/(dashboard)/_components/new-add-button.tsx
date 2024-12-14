"use client";

import { toast } from "sonner";
import { Code, Layout, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { useApiMutation } from "@/hooks/use-api-mutation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent
} from "@/components/ui/card"
import { useRouter } from "next/navigation";


interface NewBoardButtonProps {
  orgId: string;
  disabled?: boolean;
};

export const NewBoardButton = ({
  orgId,
  disabled,
}: NewBoardButtonProps) => {

  const { mutate, pending } = useApiMutation(api.board.create);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);


  function handleOptionClick(type: string) {
    if (type === "Board") {
      mutate({
        orgId,
        title: "Untitled"
      })
        .then((id) => {
          toast.success("Board created");
          // router.push(`/board/${id}`);
          setIsOpen(false);
        })
        .catch(() => toast.error("Failed to create board"));
    } else if (type === "Code Editor") {
      router.push(`/code`);
      return;
    }

  }

  const onClick = () => {

    if (disabled) {
      return;
    }
    setIsOpen(true);

    return; // TODO: Fix later


  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>What you want to choose</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Card
              className="cursor-pointer hover:bg-secondary transition-colors"
              onClick={() => handleOptionClick("Board")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Layout className="w-12 h-12 mb-4 text-primary" />
                <h3 className="text-lg font-semibold">Board</h3>
                <p className="text-sm text-center mt-2">Visualize your ideas on a collaborative canvas</p>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:bg-secondary transition-colors"
              onClick={() => handleOptionClick("Code Editor")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Code className="w-12 h-12 mb-4 text-primary" />
                <h3 className="text-lg font-semibold">Code Editor</h3>
                <p className="text-sm text-center mt-2">Write and edit code with powerful tools</p>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <button
        disabled={pending || disabled}
        onClick={onClick}
        className={cn(
          "col-span-1 aspect-[100/127] bg-blue-600 rounded-lg hover:bg-blue-800 flex flex-col items-center justify-center py-6",
          (pending || disabled) && "opacity-75 hover:bg-blue-600 cursor-not-allowed"
        )}
      >
        <div />
        <Plus className="h-12 w-12 text-white stroke-1" />
        <p className="text-sm text-white font-light">
          New board
        </p>
      </button>
    </>

  );
};