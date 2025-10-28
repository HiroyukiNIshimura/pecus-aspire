"use client";

import {
  getBackendOptions,
  MultiBackend,
  type NodeModel,
  Tree,
} from "@minoru/react-dnd-treeview";
import { useState } from "react";
import { DndProvider } from "react-dnd";
import { DEFAULT_TREE_VALUE } from "../initValue";
import { CustomDragPreview } from "./CustomDragPreview";
import { CustomNode } from "./CustomNode";
import styles from "./index.module.css";
import type { CustomData } from "./type";

//https://github.com/minop1205/react-dnd-treeview
export default function TreeView() {
  const [treeData, setTreeData] =
    useState<NodeModel<CustomData>[]>(DEFAULT_TREE_VALUE);
  const handleDrop = (newTreeData: NodeModel<CustomData>[]) =>
    setTreeData(newTreeData);

  return (
    <div>
      <DndProvider backend={MultiBackend} options={getBackendOptions()}>
        <div className={styles.app}>
          <Tree
            tree={treeData}
            rootId={0}
            render={(node, { depth, isOpen, onToggle }) => (
              <CustomNode
                node={node}
                depth={depth}
                isOpen={isOpen}
                onToggle={onToggle}
              />
            )}
            enableAnimateExpand={true}
            dragPreviewRender={(monitorProps) => (
              <CustomDragPreview monitorProps={monitorProps} />
            )}
            onDrop={handleDrop}
            classes={{
              root: styles.treeRoot,
              draggingSource: styles.draggingSource,
              dropTarget: styles.dropTarget,
            }}
          />
        </div>
      </DndProvider>
    </div>
  );
}
