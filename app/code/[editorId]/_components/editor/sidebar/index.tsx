'use client';

import React, { useEffect, useState } from 'react';
import { getIconForFile, getIconForFolder, getIconForOpenFolder } from "vscode-icons-js";
import { Input } from '@/components/ui/input';
import { FilePlus, FolderPlus, CopyMinus, ChevronRight, ChevronDown } from 'lucide-react';
import { Hint } from '@/components/hint';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

const FileTreeNode = ({ node, level = 0, onDelete, onRename, onAddFile, onAddFolder,onClickFile,activeId }: { 
  node: any; 
  level?: number; 
  onDelete: (nodeId: string,nodeName:string) => void; 
  onRename: (nodeId: string, newName: string) => void;
  onAddFile: (nodeId: string, fileName: string) => void;
  onAddFolder: (nodeId: string, folderName: string) => void;
  onClickFile: (node: any) => void;
  activeId: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);

  const toggleFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Delete",node.id);
    console.log("Delete",node.name);
    onDelete(node.id,node.name);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(true);
  };

  const submitRename = (e: React.FormEvent) => {
    e.preventDefault();
    onRename(node.id, newName);
    setIsRenaming(false);
  };

  const handleAddFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddFile(node.id, 'New File');
  };

  const handleAddFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddFolder(node.id, 'New Folder');
  };

  const renderContent = () => (
    <div className={`flex items-center space-x-2 h-6 leading-6 ${node.type === 'file' ? 'ml-6' : ''} `} onClick={toggleFolder}>
      {node.type === 'folder' && (
        <span className="cursor-pointer">
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      )}
      <img
        src={`/icons/${node.type === 'file' ? getIconForFile(node.name) : (isOpen ? getIconForOpenFolder(node.name) : getIconForFolder(node.name))}`}
        alt={`${node.type} Icon`}
        className="w-4 h-4"
      />
      {isRenaming ? (
        <form onSubmit={submitRename}>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={() => setIsRenaming(false)}
            autoFocus
            className='text-sm py-0 h-5 px-1 rounded-none'
          />
        </form>
      ) : (
        <span className={`text-sm text-gray-400 hover:text-gray-100 hover:cursor-pointer ${node.id === activeId ? 'text-white' : ''}`} onClick={() => node.type === 'file' ? onClickFile(node) : null}>
          {node.name}
        </span>
      )}
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div style={{ paddingLeft: `${level * 12}px` }}>
          {renderContent()}
          {node.type === 'folder' && isOpen && node.children && (
            <div>
              {node.children
                .sort((a: any, b: any) => {
                  if (a.type === b.type) return a.name.localeCompare(b.name);
                  return a.type === 'file' ? -1 : 1;
                })
                .map((childNode: any) => (
                  <FileTreeNode 
                    key={childNode.id} 
                    node={childNode} 
                    level={level + 1} 
                    onDelete={onDelete} 
                    onRename={onRename}
                    onAddFile={onAddFile}
                    onAddFolder={onAddFolder}
                    onClickFile={onClickFile}
                    activeId={activeId}
                  />
                ))}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem disabled onClick={handleRename}>Rename</ContextMenuItem>
        {node.type === 'folder' && (
          <>
            <ContextMenuItem onClick={handleAddFile}>New File</ContextMenuItem>
            <ContextMenuItem onClick={handleAddFolder}>New Folder</ContextMenuItem>
          </>
        )}
        <ContextMenuItem onClick={handleDelete}>Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

const FileExplorer = ({ data,setData,servervboxId,socketRef,selectFile,activeId }: any) => {
  // const [fileTree, setFileTree] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [dialogType, setDialogType] = useState<"file" | "folder" | null>(null);

  const deleteNode = (nodeId: string,fileName:string) => {
    const deleteNodeRecursive = (nodes: any[],nodeId:string): any[] => {
      return nodes.reduce((acc: any[], node: any) => {
        if (node.id === nodeId) {
          return acc; 
        }
        if (node.type === 'folder' && node.children) {
          return [...acc, { ...node, children: deleteNodeRecursive(node.children,nodeId) }];
        }
        return [...acc, node];
      }, []);
    };
    const socketData = {
      virtualboxId:servervboxId,
      bucketPath:`virtualbox/${servervboxId}/${fileName}`,
      fileId:nodeId
    }
    socketRef.current.emit('fileDelete',socketData);
    socketRef.current.on('fileDeletedBroadcast', (resp: any) => {
      setData(deleteNodeRecursive(data,resp?.fileId));
    });

  };

  const renameNode = (nodeId: string, newName: string) => {
    const renameNodeRecursive = (nodes: any[]): any[] => {
      return nodes.map((node: any) => {
        if (node.id === nodeId) {
          return { ...node, name: newName };
        }
        if (node.type === 'folder' && node.children) {
          return { ...node, children: renameNodeRecursive(node.children) };
        }
        return node;
      });
    };

    setData(renameNodeRecursive(data));
  };

  const addNode = (parentId: string | null, newNode: any) => {
    const addNodeRecursive = (nodes: any[]): any[] => {
      return nodes.map((node: any) => {
        if (node.id === parentId) {
          return { 
            ...node, 
            children: [...(node.children || []), newNode]
          };
        }
        if (node.type === 'folder' && node.children) {
          return { ...node, children: addNodeRecursive(node.children) };
        }
        return node;
      });
    };

    setData(parentId ? addNodeRecursive(data) : [...data, newNode]);
  };

  const handleAddFile = (parentId: string | null, fileName: string) => {
    const newFile = {
      name: fileName,
      type: 'file',
      saved:true,
      content:''
    };
    const socketData = {
      fileName,
      virtualboxId:servervboxId,
      bucketPath:`virtualbox/${servervboxId}/${fileName}`,
      folderId:null
    }
    socketRef.current.emit('fileCreate',socketData);
    socketRef.current.on('fileCreatedBroadcast', (data: any) => {
      addNode(null, data);
    });
  };

  const handleAddFolder = (parentId: string | null, folderName: string) => {
    const newFolder = {
      id: Date.now().toString(),
      name: folderName,
      type: 'folder',
      children: []
    };
    addNode(parentId, newFolder);
  };

  const handleDialogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dialogType === 'file') {
      handleAddFile(null, newItemName);
    } else if (dialogType === 'folder') {
      handleAddFolder(null, newItemName);
    }
    setDialogType(null);
    setNewItemName("");
  };

  const handleClickFile = (node: any) => {
    selectFile(node);
  };

  useEffect(() => {
    const socket = socketRef.current;
    return () => {
      if (socket) {
        socket.off('fileCreatedBroadcast');
      }
    }
  },[socketRef])
  return (
    <div className="px-2 rounded shadow">
      <div className="my-3 space-x-2 cursor-pointer flex items-center justify-end gap-1">
        <Hint label={'Add file'} side="top" align="center" sideOffset={0} alignOffset={0}>
          <div onClick={() => setDialogType("file")}>
            <FilePlus size={16} color='grey' />
          </div>
        </Hint>
        <Hint label={'Add folder'} side="top" align="center" sideOffset={0} alignOffset={0}>
          {/* <div onClick={() => setDialogType("folder")}> */}
          <div onClick={()=>alert("Development in progress !")}>
            <FolderPlus className='' size={17} color='grey' />
          </div>
        </Hint>
        <Hint label={'Close all folders'} side="top" align="center" sideOffset={0} alignOffset={0}>
          <div onClick={()=>alert("Development in progress !")}>
            <CopyMinus size={16} color='grey' />
          </div>
        </Hint>
      </div>

      <div>
        {data
          .sort((a: any, b: any) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'file' ? -1 : 1;
          })
          .map((node: any) => (
            <FileTreeNode 
              key={node.id} 
              node={node} 
              onDelete={deleteNode} 
              onRename={renameNode}
              onAddFile={handleAddFile}
              onAddFolder={handleAddFolder}
              onClickFile={handleClickFile}
              activeId={activeId}
            />
          ))}
      </div>

      <Dialog open={dialogType !== null} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogType === 'file' ? 'Add New File' : 'Add New Folder'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDialogSubmit}>
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={dialogType === 'file' ? 'File name' : 'Folder name'}
              className="my-4"
            />
            <DialogFooter>
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileExplorer;

