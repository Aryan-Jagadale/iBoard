import { openDB } from "idb";

const DB_NAME = "buildsDB";
const STORE_NAME = "builds";

const openDatabase = async () => {
    return await openDB(DB_NAME, 1, {
        upgrade(db) {
            db.createObjectStore(STORE_NAME, { keyPath: "vbId" });
        },
    });
};

// Save build data
export const saveBuildToIndexedDB = async (vbId:string, bundle:any, cssFiles?:any) => {
    const db = await openDatabase();
    await db.put(STORE_NAME, { vbId, bundle, cssFiles, timestamp: Date.now() });
};

// Load build data
export const loadBuildFromIndexedDB = async (vbId:string) => {
    const db = await openDatabase();
    return db.get(STORE_NAME, vbId);
};

// Delete build data
export const deleteBuildFromIndexedDB = async (vbId:string) => {
    const db = await openDatabase();
    return db.delete(STORE_NAME, vbId);
};

export const hasBuildInIndexedDB = async (vbId:string) => {
    const db = await openDatabase();
    const build = await db.get(STORE_NAME, vbId);
    return !!build;
};


export const isBuildOutdated = async (vbId:string, threshold = 24 * 60 * 60 * 1000) => { 
    const db = await openDatabase();
    const build = await db.get("builds", vbId);
    
    if (!build) return true; // No build found, needs rebuild

    const age = Date.now() - build.timestamp;
    return age > threshold; // Returns true if build is older than the threshold
};
