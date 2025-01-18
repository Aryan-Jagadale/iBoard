import ProjectCard from "./projectCard";
import ProjectCardDropdown from "./projectCard/dropdown";
import { Clock, Globe, Lock } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { formatDistanceToNow } from "date-fns";
import { deleteRequest } from "@/lib/axios";

export default function DashboardProjects({
  virtualboxes,
  q,
}: {
  virtualboxes: any[];
  q: string | null;
}) {
  const { mutate, pending }  = useApiMutation(api.virtualBoxes.deleteVirtualbox);
  const update  = useApiMutation(api.virtualBoxes.updateVirtualbox);
  
  const onDelete = async (virtualbox: any) => {
    // const resposne:any = await deleteRequest(`/api/deleteVirtualBoxData/${virtualbox._id}`);
    // console.log("resposne", resposne);
    
    // await mutate({id: virtualbox._id});
    toast(`Project ${virtualbox.name} deleted.`);
  };

  const onVisibilityChange = async (virtualbox: any) => {
    const newVisibility =
      virtualbox.visibility === "public" ? "private" : "public";
      await update.mutate({id: virtualbox._id, visibility: newVisibility});
      toast(`Project ${virtualbox.name} is now ${newVisibility}`);
  };


  const icon = (type: string) => {
    switch (type) {
      case "react":
        return "/project-icons/react.svg";
      case "node":
        return "/project-icons/node.svg";
      case "html-css":
        return "/icons/file_type_html.svg";
      case "python":
        return "/project-icons/python.svg";
      default:
        return "/icons/file_type_html.svg";
    }
  }

  return (
    <div className="grow p-4 flex flex-col">
      <div className="text-xl font-medium mb-8">
        {q && q.length > 0 ? `Showing search results for: ${q}` : "My Projects"}
      </div>
      <div className="grow w-full grid lg:grid-cols-3 2xl:grid-cols-4 md:grid-cols-2 gap-4 overflow-y-auto">
        {virtualboxes.map((virtualbox) => {
          if (q && q.length > 0) {
            if (!virtualbox.name.toLowerCase().includes(q.toLowerCase())) {
              return null;
            }
          }
          return (
            <ProjectCard key={virtualbox.virtualboxId} id={virtualbox.virtualboxId}>
              <div className="flex space-x-2 items-center justify-start w-full">
                <Image
                  alt="icon"
                  src={icon(virtualbox.type)}
                  width={20}
                  height={20}
                />
                <div className="font-medium flex items-center whitespace-nowrap w-full text-ellipsis overflow-hidden">
                  {virtualbox.name}
                </div>
                <ProjectCardDropdown
                  virtualbox={virtualbox}
                  onVisibilityChange={onVisibilityChange}
                  onDelete={onDelete}
                />
              </div>

              <div className="flex flex-col text-muted-foreground space-y-0.5 text-sm">
                <div className="flex items-center">
                  {virtualbox.visibility === "public" ? (
                    <>
                      <Globe className="mr-2 h-4 w-4" />
                      <span>Public</span>
                    </>
                  ) : (
                    <>
                    <Lock className="mr-2 h-4 w-4" />
                    <span>Private</span>
                    </>
                  )}
                </div>
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-2" /> {formatDistanceToNow(new Date(Math.floor(virtualbox?._creationTime)), { addSuffix: true })}
                </div>
              </div>
            </ProjectCard>
          );
        })}
      </div>
    </div>
  );
}