import { Scene } from "@babylonjs/core/scene";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { ActionManager } from "@babylonjs/core/Actions/actionManager";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions";
import { Color3 } from "@babylonjs/core/Maths/math.color";

import { Room } from "colyseus.js";
import { EntityState } from "../../../server/rooms/schema/EntityState";
import Config from "../../Config";
import { Race } from "../../Entities/Common/Races";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Entity } from "../Entity";

export class EntityMesh {
    private _entity: Entity;
    private _scene: Scene;
    private _loadedAssets;
    private _room;
    private _animationGroups: AnimationGroup[];
    public mesh: Mesh;
    public playerMesh;
    public isCurrentPlayer: boolean;
    public debugMesh: Mesh;
    public selectedMesh: Mesh;

    constructor(entity: Entity) {
        this._entity = entity;
        this._scene = entity._scene;
        this._loadedAssets = entity._loadedAssets;
        this.isCurrentPlayer = entity.isCurrentPlayer;
        this._room = entity._room;
    }

    public async load() {
        // create collision cube
        const box = MeshBuilder.CreateBox(this._entity.sessionId, { width: 2, height: 4, depth: 3 }, this._scene);
        box.visibility = 0;

        // set collision mesh
        this.mesh = box;
        this.mesh.isPickable = true;
        this.mesh.isVisible = false;
        this.mesh.checkCollisions = true;
        this.mesh.showBoundingBox = true;
        this.mesh.position = new Vector3(this._entity.x, this._entity.y, this._entity.z);
        this.mesh.metadata = {
            sessionId: this._entity.sessionId,
            type: this._entity.type,
            race: this._entity.race,
            name: this._entity.name,
        };

        // debug aggro mesh
        if (this._entity.type === "entity") {
            var material = this._scene.getMaterialByName("debug_entity_neutral");
            const sphere = MeshBuilder.CreateCylinder(
                "debug_" + this._entity.race,
                { diameter: Config.MONSTER_AGGRO_DISTANCE * 2, height: 0.1 },
                this._scene
            );
            sphere.isVisible = false;
            sphere.parent = box;
            sphere.material = material;
            this.debugMesh = sphere;
        }

        // add selected image
        var material = this._scene.getMaterialByName("entity_selected");
        const selectedMesh = MeshBuilder.CreateCylinder(
            "entity_selected_" + this._entity.race,
            { diameter: 2, height: 0.01, tessellation: 10 },
            this._scene
        );
        selectedMesh.parent = box;
        selectedMesh.material = material;
        selectedMesh.isVisible = false;
        selectedMesh.isPickable = false;
        selectedMesh.checkCollisions = false;
        this.selectedMesh = selectedMesh;

        // load player mesh
        const result = this._loadedAssets[this._entity.race].instantiateModelsToScene();
        const playerMesh = result.rootNodes[0];
        this._animationGroups = result.animationGroups;

        // set initial player scale & rotation
        playerMesh.name = this._entity.sessionId + "_mesh";
        playerMesh.parent = box;
        playerMesh.rotationQuaternion = null; // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
        if (this._entity.rotationFix) {
            playerMesh.rotation.set(0, this._entity.rotationFix, 0);
        }
        playerMesh.scaling.set(this._entity.scale, this._entity.scale, this._entity.scale);
        playerMesh.isPickable = false;
        playerMesh.checkCollisions = false;
        this.playerMesh = playerMesh;

        // start action manager
        this.mesh.actionManager = new ActionManager(this._scene);

        // setup collisions for current player
        if (this.isCurrentPlayer) {
            // teleport collision
            // terrible stuff here, I need to improve to be more dynamic
            let targetMesh = this._scene.getMeshesByTags("teleport");
            this.mesh.actionManager.registerAction(
                new ExecuteCodeAction(
                    {
                        trigger: ActionManager.OnIntersectionEnterTrigger,
                        parameter: targetMesh,
                    },
                    (test) => {
                        if (this.isCurrentPlayer) {
                            console.log("player collided with mesh: ", test);
                        }
                        /*
                        if (this.mesh.metadata.sessionId === this._entity.sessionId) {
                            this._room.send("playerTeleport", targetMesh.metadata.location);
                        }*/
                    }
                )
            );
        }

        // register hover over player
        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (ev) => {
                let meshes = ev.meshUnderPointer.getChildMeshes();
                let mesh = meshes.length === 2 ? meshes[1] : meshes[2];
                mesh.outlineColor = new Color3(0, 1, 0);
                mesh.outlineWidth = 3;
                mesh.renderOutline = true;
            })
        );

        // register hover out player
        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, (ev) => {
                let meshes = ev.meshUnderPointer.getChildMeshes();
                let mesh = meshes.length === 2 ? meshes[1] : meshes[2];
                mesh.renderOutline = false;
            })
        );
    }

    public getAnimation() {
        return this._animationGroups;
    }
}
