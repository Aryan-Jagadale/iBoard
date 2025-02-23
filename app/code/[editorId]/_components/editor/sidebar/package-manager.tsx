'use client'



import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchPackageCdn } from "@/lib/packageFetcher"

const fetchPackages = async (search: string) => {
    const response:any = await fetchPackageCdn(search)
    return [
        { name: response.packageName, version: response.version }
    ]
}

export default function PackageManager() {
    const [isOpen, setIsOpen] = useState(false)
    const [packages, setPackages] = useState<Array<{ name: string; version: string }>>([{ name: "react", version: "18.0.2" },
    { name: "react-dom", version: "18.0.2" }])
    const [newPackage, setNewPackage] = useState({ name: "", version: "" })
    const [suggestions, setSuggestions] = useState<Array<{ name: string; version: string }>>([])
    const [showInputs, setShowInputs] = useState(false)

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (newPackage.name.length > 2) {
                const results = await fetchPackages(newPackage.name)
                setSuggestions(results)
            } else {
                setSuggestions([])
            }
        }
        fetchSuggestions()
    }, [newPackage.name])

    const handleAddPackage = () => {
        if (newPackage.name && newPackage.version) {
            setPackages([...packages, newPackage])
            setNewPackage({ name: "", version: "" })
            setShowInputs(false)
        }
    }

    const toggleInputs = () => {
        setShowInputs(!showInputs)
        setNewPackage({ name: "", version: "" })
        setSuggestions([])
    }

    return (
        <div className="p-4">
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
                <DrawerTrigger asChild>
                    <Button>Open Package Manager</Button>
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
                                                        onClick={() => setNewPackage(suggestion)}
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