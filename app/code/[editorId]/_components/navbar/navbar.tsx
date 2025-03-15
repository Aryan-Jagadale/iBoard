'use client';
import Image from "next/image"
import Link from "next/link"
import Logo from "@/public/logo.svg";
import DashboardNavbarSearch from "./search";
import { Button } from "@/components/ui/button";
import { Cloud } from 'lucide-react';
import { deleteBuildFromIndexedDB, loadBuildFromIndexedDB } from "@/lib/db";
import { usePathname } from 'next/navigation'
import { savetoS3 } from "@/lib/axios";
import { toast } from "sonner";
import { useState } from "react";

const Navbar = ({ showSearch = false }) => {
  const pathname = usePathname();
  const [isSaving, setIsSaving] = useState(false)


  const handleSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true)
      const vbId: any = pathname.split("/").pop();
      const buildData = await loadBuildFromIndexedDB(vbId);
      if (!buildData) {
        toast.error("No data to save");
        return;
      }
      const resp: any = await savetoS3(buildData);
      if (resp.status === 200) {
        toast.success("Saved to cloud");
        await deleteBuildFromIndexedDB(vbId);
        return;
      }
      toast.error("Failed to save to cloud");
      return;
    } catch (error) {
      console.log("Error in save", error);
      toast.error("Failed to save to cloud");
      return
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-14 px-2 w-full border-b border-border flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Link
          href={"/"}
          className="ring-offset-2 ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none rounded-sm"
        >
          <Image src={Logo} alt="Logo" width={36} height={36} />
        </Link>
        <div className="text-sm font-medium flex items-center">Sandbox</div>
      </div>
      {showSearch && (
        <div className="flex items-center space-x-4">
          <DashboardNavbarSearch />
        </div>
      )}
      {
        !showSearch && (
          <Button onClick={handleSave} disabled={isSaving} variant={'outline'} className={`gap-2 border-green-500 text-green-500`}>
            <Cloud className="h-6 w-6" />
            {isSaving ? "Saving...!!!" : "Save to Cloud"}
          </Button>
        )
      }
    </div>
  )
}

export default Navbar