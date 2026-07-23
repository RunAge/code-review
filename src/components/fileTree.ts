import type { FileProgress } from "./fileTreeProgress";

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: "folder" | "file";
  reviewed: number;
  total: number;
  children: FileTreeNode[];
}

function createFolderNode(id: string, name: string, path: string): FileTreeNode {
  return {
    id,
    name,
    path,
    type: "folder",
    reviewed: 0,
    total: 0,
    children: []
  };
}

export function buildFileTree(entries: FileProgress[]): FileTreeNode[] {
  const rootMap = new Map<string, FileTreeNode>();

  for (const entry of entries) {
    const parts = entry.filePath.split("/").filter(Boolean);
    if (parts.length === 0) {
      continue;
    }

    let currentChildren = rootMap;
    let currentPath = "";
    let parentNode: FileTreeNode | null = null;

    for (let index = 0; index < parts.length; index += 1) {
      const part = parts[index];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLeaf = index === parts.length - 1;

      if (isLeaf) {
        const fileNode: FileTreeNode = {
          id: currentPath,
          name: part,
          path: entry.filePath,
          type: "file",
          reviewed: entry.reviewed,
          total: entry.total,
          children: []
        };

        if (parentNode) {
          parentNode.children.push(fileNode);
        } else {
          rootMap.set(fileNode.id, fileNode);
        }

        continue;
      }

      let folderNode = currentChildren.get(currentPath);
      if (!folderNode) {
        folderNode = createFolderNode(currentPath, part, currentPath);

        if (parentNode) {
          parentNode.children.push(folderNode);
        } else {
          rootMap.set(folderNode.id, folderNode);
        }
      }

      parentNode = folderNode;

      const nestedMap = new Map<string, FileTreeNode>();
      for (const child of folderNode.children) {
        nestedMap.set(child.id, child);
      }
      currentChildren = nestedMap;
    }
  }

  function sortAndRollup(nodes: FileTreeNode[]): FileTreeNode[] {
    const folders = nodes
      .filter((node) => node.type === "folder")
      .map((folder) => {
        folder.children = sortAndRollup(folder.children);
        folder.reviewed = folder.children.reduce((sum, child) => sum + child.reviewed, 0);
        folder.total = folder.children.reduce((sum, child) => sum + child.total, 0);
        return folder;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const files = nodes
      .filter((node) => node.type === "file")
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...folders, ...files];
  }

  return sortAndRollup(Array.from(rootMap.values()));
}
