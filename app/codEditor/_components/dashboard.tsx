'use client'

import {
    Code2,
    FolderDot,
    HelpCircle,
    Plus,
    Settings,
    Users,
} from "lucide-react";
import CustomButton from "@/components/ui/customButton";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import NewProjectModal from "./newProject";


type TScreen = "projects" | "shared" | "settings" | "search";


const Dashboard = () => {

    const [screen, setScreen] = useState<TScreen>("projects");
    const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
    const [aboutModalOpen, setAboutModalOpen] = useState(false);

    const activeScreen = (s: TScreen) => {
        if (screen === s) return "justify-start";
        else return "justify-start font-normal text-muted-foreground";
    };

    const searchParams = useSearchParams();
    const q = searchParams.get("q");


    return (
        <>
            <NewProjectModal
                open={newProjectModalOpen}
                setOpen={setNewProjectModalOpen}
            />

            <div className="flex grow w-full">
                <div className="w-56 shrink-0 border-r border-border p-4 justify-between flex flex-col">
                    <div className="flex flex-col">
                        <Button
                            variant={"secondary"}
                            className="mb-4"
                            onClick={() => {
                                setNewProjectModalOpen(true);
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Project
                        </Button>
                        <Button
                            variant={"ghost"}
                            onClick={() => setScreen("projects")}
                            className={activeScreen("projects")}
                        >
                            <FolderDot className="w-4 h-4 mr-2" />
                            My Projects
                        </Button>
                        <Button
                            variant={"ghost"}
                            onClick={() => setScreen("shared")}
                            className={activeScreen("shared")}
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Shared With Me
                        </Button>
                        <Button
                            variant={"ghost"}
                            onClick={() => setScreen("settings")}
                            className={activeScreen("settings")}
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </Button>
                    </div>
                    <div className="flex flex-col">
                        <Button
                            variant={"ghost"}
                            className="justify-start font-normal text-muted-foreground"
                        >
                            <Code2 className="w-4 h-4 mr-2" />
                            Github Repo
                        </Button>
                        <Button
                            onClick={() => setAboutModalOpen(true)}
                            variant={"ghost"}
                            className="justify-start font-normal text-muted-foreground"
                        >
                            <HelpCircle className="w-4 h-4 mr-2" />
                            About
                        </Button>
                    </div>
                </div>
                {screen === "projects" ? (
                    <div> Projects</div>
                ) : screen === "shared" ? (
                    <div> Shared</div>
                ) : screen === "settings" ? null : null}
            </div>


        </>
    )
}

export default Dashboard