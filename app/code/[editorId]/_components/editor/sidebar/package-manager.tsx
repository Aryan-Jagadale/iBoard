'use client'
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchPackageCdn, updatePackageJson,removeDependencyFromPackageJson, fetchPackages } from "@/lib/packageFetcher"
import { useDebounce } from "@/hooks/useDebounce"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function PackageManager({ servervboxId,socketRef, newPackages, setNewPackages, serverFiles, setServerFiles }: any) {
    const [isOpen, setIsOpen] = useState(false)
    const [packages, setPackages] = useState<Array<{ name: string; version: string,main:string }>>([{ name: "react", version: "18.0.2",main:"react.development.js" },
    { name: "react-dom", version: "18.0.2",main:"react-dom.development.js" }])
    const [newPackage, setNewPackage] = useState({ name: "", version: "", main: "" })
    const [suggestions, setSuggestions] = useState<Array<{ name: string; version: string; main: string; }>>([])
    const [showInputs, setShowInputs] = useState(false)

    const debouncedFetchSuggestions = useDebounce(async () => {
        if (newPackage.name.length > 2) {
            const results = await fetchPackages(newPackage.name);
            if (results.length === 0) {
                return toast.error("No packages found with that name");
            }
            setSuggestions(results);
        } else {
            setSuggestions([]);
        }}, { delay: 5000 });

    const debouncedFileUpdate = useDebounce((fileId: string, content: string, virtualboxId: string, bucketPath: string, fileName: string) => {
        socketRef.current?.emit("fileUpdate", {
            fileId,
            content,
            virtualboxId,
            bucketPath,
            fileName
        });
    }, { delay: 10000 });

    useEffect(() => {
        debouncedFetchSuggestions();
    }, [newPackage.name]);

    const handleAddPackage = () => {
        if (newPackage.name && newPackage.version) {
            const updatedPackages = [...newPackages, { name: newPackage.name, version: newPackage.version, main: newPackage.main }];
            setPackages([...packages, newPackage])
            setNewPackage({ name: "", version: "", main: "" })
            setShowInputs(false)
            setNewPackages([...newPackages, { name: newPackage.name, version: newPackage.version, main: newPackage.main }])
            const packageJsonContent = JSON.stringify({
                dependencies: Object.fromEntries(updatedPackages.map(pkg => [pkg.name, pkg.version]))
            }, null, 2);
            const packageJsonFile = serverFiles.find((file: any) => file.name === "package.json");
            const updatedPkgJson = updatePackageJson(packageJsonFile, JSON.parse(packageJsonContent));
            const vbId = servervboxId;
            debouncedFileUpdate(updatedPkgJson.fileId, updatedPkgJson.content, vbId, updatedPkgJson.bucketPath, updatedPkgJson.name);
            socketRef.current?.on("fileUpdatedBroadcast", (data: any) => {
                const updatedFiles: any[] = serverFiles.map((fileOrFolder: any) => {
                    if (fileOrFolder.id === data.fileId) {
                        return { ...fileOrFolder, content: data.content, saved: true };
                    }
                    return fileOrFolder;
                });
                setServerFiles(updatedFiles);
            });
        }
    }

    const handleDeletePackage = (packageName: string) => {
        if (packageName === "react" || packageName === "react-dom") return
        const updatedPackages = packages.filter((pkg) => pkg.name !== packageName)
        const updatedNewPackages = newPackages.filter((pkg: any) => pkg.name !== packageName)
    
        setPackages(updatedPackages)
        setNewPackages(updatedNewPackages)

        const packageJsonFile = serverFiles.find((file: any) => file.name === "package.json");
        const updatedPkgJson = removeDependencyFromPackageJson(packageJsonFile, packageName);
        const vbId = servervboxId;
        debouncedFileUpdate(updatedPkgJson.fileId, updatedPkgJson.content, vbId, updatedPkgJson.bucketPath, updatedPkgJson.name);
        socketRef.current?.on("fileUpdatedBroadcast", (data: any) => {
            const updatedFiles: any[] = serverFiles.map((fileOrFolder: any) => {
                if (fileOrFolder.id === data.fileId) {
                    return { ...fileOrFolder, content: data.content, saved: true };
                }
                return fileOrFolder;
            });
            setServerFiles(updatedFiles);
        });
    }

    const toggleInputs = () => {
        setShowInputs(!showInputs)
        setNewPackage({ name: "", version: "", main: "" })
        setSuggestions([])
    }

    useEffect(() => {
        const packageJsonFile = serverFiles.find((file: any) => file.name === "package.json");
        if (packageJsonFile) {
            const packageJson = JSON.parse(packageJsonFile.content);
            const dependencies = packageJson.dependencies;
            const packages = Object.keys(dependencies).map((key) => ({ name: key, version: dependencies[key], main: "" }));
            setPackages(packages);
        }
    },[serverFiles])

    return (
        <div className="p-4">
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
                <DrawerTrigger asChild>
                    <Button>Add npm Packages</Button>
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Package Manager</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>package.json</TableHead>
                                    <TableHead>version</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {packages.map((pkg, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{pkg.name}</TableCell>
                                        <TableCell>{pkg.version}</TableCell>
                                        <TableCell>
                                            {pkg.name !== "react" && pkg.name !== "react-dom" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeletePackage(pkg.name)}
                                                    className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Delete {pkg.name}</span>
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {showInputs && (
                            <div className="mt-4 space-y-4">
                                <div className="flex space-x-4">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Package name"
                                            value={newPackage.name}
                                            onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                                        />
                                        {suggestions.length > 0 && (
                                            <ul className="mt-2 bg-background border rounded-md shadow-sm">
                                                {suggestions.map((suggestion, index) => (
                                                    <li
                                                        key={index}
                                                        className="px-3 py-2 hover:bg-muted cursor-pointer"
                                                        onClick={() => { setNewPackage(suggestion); setSuggestions([]) }}
                                                    >
                                                        {suggestion.name} ({suggestion.version})
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Version"
                                            value={newPackage.version}
                                            onChange={(e) => setNewPackage({ ...newPackage, version: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handleAddPackage}>Save</Button>
                                    <Button className="ml-4" onClick={toggleInputs}>Cancel</Button>
                                </div>
                            </div>
                        )}
                        {
                            !showInputs && (
                                <div className="flex justify-end">
                                    <Button className="mt-4" onClick={toggleInputs}>
                                        Add package.json
                                    </Button>
                                </div>
                            )
                        }
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    )
}