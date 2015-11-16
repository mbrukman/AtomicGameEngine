//
// Copyright (c) 2014-2015, THUNDERBEAST GAMES LLC All rights reserved
// LICENSE: Atomic Game Engine Editor and Tools EULA
// Please see LICENSE_ATOMIC_EDITOR_AND_TOOLS.md in repository root for
// license information: https://github.com/AtomicGameEngine/AtomicGameEngine
//

import EditorEvents = require("editor/EditorEvents");
import ScriptWidget = require("ui/ScriptWidget");
import DataBinding = require("./DataBinding");

// inspectors

import MaterialInspector = require("./MaterialInspector");
import ModelInspector = require("./ModelInspector");
import NodeInspector = require("./NodeInspector");
import AssemblyInspector = require("./AssemblyInspector");
import PrefabInspector = require("./PrefabInspector");

class InspectorFrame extends ScriptWidget {

    nodeInspector: NodeInspector;
    scene: Atomic.Scene = null;
    sceneEditor: Editor.SceneEditor3D;

    constructor() {

        super();

        this.gravity = Atomic.UI_GRAVITY_TOP_BOTTOM;

        this.load("AtomicEditor/editor/ui/inspectorframe.tb.txt");

        var container = this.getWidget("inspectorcontainer");

        this.subscribeToEvent(EditorEvents.EditResource, (data) => this.handleEditResource(data));
        this.subscribeToEvent("ProjectUnloaded", (data) => this.handleProjectUnloaded(data));
        this.subscribeToEvent("NodeRemoved", (ev: Atomic.NodeRemovedEvent) => this.handleNodeRemoved(ev));

        this.subscribeToEvent(EditorEvents.ActiveSceneEditorChange, (data) => this.handleActiveSceneEditorChanged(data));

    }

    handleActiveSceneEditorChanged(event: EditorEvents.ActiveSceneEditorChangeEvent) {

        if (this.scene)
            this.unsubscribeFromEvents(this.scene);

        this.sceneEditor = null;
        this.scene = null;

        if (!event.sceneEditor)
            return;

        this.sceneEditor = event.sceneEditor;
        this.scene = event.sceneEditor.scene;

        if (this.scene) {

            this.subscribeToEvent(this.scene, "SceneNodeSelected", (event: Editor.SceneNodeSelectedEvent) => this.handleSceneNodeSelected(event));

        }

    }

    handleSceneNodeSelected(ev: Editor.SceneNodeSelectedEvent) {

        var selection = this.sceneEditor.selection;

        if (selection.selectedNodeCount == 1) {
            this.inspectNode(selection.getSelectedNode(0));
        } else {
            this.closeNodeInspector();
        }

        return;
    }


    handleProjectUnloaded(data) {

        this.closeNodeInspector();
        var container = this.getWidget("inspectorcontainer");
        container.deleteAllChildren();
    }


    handleEditResource(ev: EditorEvents.EditResourceEvent) {

        var path = ev.path;

        var db = ToolCore.getAssetDatabase();
        var asset = db.getAssetByPath(path);

        if (asset) {

            this.inspectAsset(asset);

        }

    }

    closeNodeInspector() {

        if (this.nodeInspector) {
            this.nodeInspector.saveState();
            var container = this.getWidget("inspectorcontainer");
            container.deleteAllChildren();
            this.nodeInspector = null;
        }

    }


    inspectAsset(asset: ToolCore.Asset) {

        var container = this.getWidget("inspectorcontainer");
        container.deleteAllChildren();

        if (asset.importerTypeName == "ModelImporter") {

            var inspector = new ModelInspector();
            container.addChild(inspector);

            inspector.inspect(asset);

        }

        if (asset.importerTypeName == "MaterialImporter") {

            var cache = Atomic.getResourceCache();

            var material = <Atomic.Material>cache.getResource("Material", asset.path);

            if (!material) {
                return;
            }

            var materialInspector = new MaterialInspector();
            container.addChild(materialInspector);

            materialInspector.inspect(asset, material);
        }

        if (asset.importerTypeName == "NETAssemblyImporter") {

            var assemblyInspector = new AssemblyInspector();
            container.addChild(assemblyInspector);

            assemblyInspector.inspect(asset);

        }

        if (asset.importerTypeName == "PrefabImporter") {

            var prefabInspector = new PrefabInspector();
            container.addChild(prefabInspector);

            prefabInspector.inspect(asset);
        }

    }

    handleNodeRemoved(ev: Atomic.NodeRemovedEvent) {

        if (this.nodeInspector && this.nodeInspector.node != ev.node)
            return;

        this.closeNodeInspector();

    }


    inspectNode(node: Atomic.Node) {

        if (!node) return;

        this.closeNodeInspector();

        var container = this.getWidget("inspectorcontainer");
        container.deleteAllChildren();

        var inspector = new NodeInspector();
        container.addChild(inspector);

        inspector.inspect(node);

        this.nodeInspector = inspector;

    }

}

export = InspectorFrame;
