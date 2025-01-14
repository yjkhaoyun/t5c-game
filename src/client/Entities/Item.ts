import { Scene } from "@babylonjs/core/scene";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import { ActionManager } from "@babylonjs/core/Actions/actionManager";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Room } from "colyseus.js";
import { UserInterface } from "../Controllers/UserInterface";
import { PlayerInput } from "../Controllers/PlayerInput";

import { randomNumberInRange } from "../../shared/Utils";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { mergeMesh } from "./Common/MeshHelper";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { GameController } from "../Controllers/GameController";
import { Mesh } from "@babylonjs/core";

export class Item extends TransformNode {
    public _game: GameController;
    public _scene: Scene;
    public _room: Room;
    public _ui: UserInterface;
    public _input: PlayerInput;

    // entity
    public entity;
    public sessionId;
    public mesh;
    public overlay_mesh;
    public characterLabel: Rectangle;
    public type: string = "";

    public name: string = "";
    public key: string;
    public x: number;
    public y: number;
    public z: number;
    public rot: number;
    public qty: number;

    //
    public meshData;

    // flags
    public blocked: boolean = false; // if true, player will not moved

    constructor(name, scene: Scene, entity, room: Room, ui: UserInterface, game: GameController) {
        super(name, scene);

        // setup class variables
        this._scene = scene;
        this._game = game;
        this._room = room;
        this._ui = ui;

        // add entity data
        this.name = entity.key + "_"+entity.sessionId;
        this.entity = entity;

        // update player data from server data
        Object.assign(this, this._game.getGameData("item", entity.key));

        // update player data from server data
        Object.assign(this, this.entity);

        // set parent metadata
        this.metadata = {
            sessionId: entity.sessionId,
            type: "item",
            name: entity.name,
        };

        // spawn item
        this.spawn(entity);
    }

    public async spawn(entity, mode = "clone") {
        // load item mesh
        if (mode === "instance") {
            // instance
            this.mesh = this._game._loadedAssets["ROOT_ITEM_" + entity.key].createInstance("TEST_" + entity.sessionId);
            this._game._loadedAssets["ROOT_ITEM_" + entity.key].setParent(null);
        } else if (mode === "clone") {
            // clone
            if (this._game._loadedAssets["ROOT_ITEM_" + entity.key]) {

                this.mesh = this._game._loadedAssets["ROOT_ITEM_" + entity.key].clone("TEST_" + entity.sessionId);

            } else {
                console.error("Could not find key: ROOT_ITEM_" + entity.key, this._game._loadedAssets);
            }

            // import normal
        } else {
            const result = await this._game._loadedAssets["ITEM_" + entity.key].instantiateModelsToScene(
                (name) => "instance_" + this.entity.sessionId, 
                false, {
                doNotInstantiate: false,
            });
            this.mesh = result.rootNodes[0] as Mesh; 
        }

        // set initial player scale & rotation
        this.mesh.parent = this;

        // set collision mesh
        this.mesh.name = entity.key + "_box";
        this.mesh.isPickable = true;
        this.mesh.isVisible = true;
        this.mesh.checkCollisions = false;
        this.mesh.showBoundingBox = false;
        this.mesh.receiveShadows = false;

        // offset mesh from the ground
        let meshSize = this.mesh.getBoundingInfo().boundingBox.extendSize;
        this.mesh.position.y += meshSize.y * this.meshData.scale;
        this.mesh.rotationQuaternion = null; // You cannot use a rotationQuaternion followed by a rotation on the same mesh. Once a rotationQuaternion is applied any subsequent use of rotation will produce the wrong orientation, unless the rotationQuaternion is first set to null.
        this.mesh.rotation = new Vector3(0, randomNumberInRange(0, 360), 0);
        this.mesh.scaling = new Vector3(this.meshData.scale, this.meshData.scale, this.meshData.scale);

        // set mesh metadata
        this.mesh.metadata = {
            sessionId: this.entity.sessionId,
            type: "item",
            key: this.key,
            name: this.entity.name,
        };

        // add mesh to shadow generator
        this.setPosition();

        //////////////////////////////////////////////
        // entity network event
        // colyseus automatically sends entity updates, so let's listen to those changes
        this.entity.onChange(() => {
            // update player data from server data
            Object.assign(this, this.entity);

            this.setPosition();
        });

        ///
        // start action manager
        this.mesh.actionManager = new ActionManager(this._scene);

        // register hover over player
        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (ev) => {
                let mesh = ev.meshUnderPointer;
                console.log(mesh);
                if(mesh){
                    mesh.overlayColor = new Color3(1, 1, 1);
                    mesh.overlayAlpha = 0.3;
                    mesh.renderOverlay = true;
                }   
            })
        );

        // register hover out player
        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, (ev) => {
                let mesh = ev.meshUnderPointer;
                if(mesh){
                    mesh.renderOverlay = false;
                }
            })
        );

        // register hover out player
        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnLeftPickTrigger, (ev) => {
                if(ev.meshUnderPointer){
                    let item = ev.meshUnderPointer.metadata;
                    this._room.send("pickup_item", {
                        sessionId: item.sessionId,
                    });
                }
                
            })
        );

        /*
        this.mesh.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, (ev) => {
                // remove any previous overlay
                if (this.overlay_mesh) {
                    this.overlay_mesh.dispose();
                }

                // hide original mesh
                this.mesh.isVisible = false;

                // clone mesh from memory
                this.overlay_mesh = this._game._loadedAssets["ROOT_ITEM_" + entity.key].clone("OVERLAY_" + entity.sessionId);
                this.overlay_mesh.metadata = this.mesh.metadata;
                this.overlay_mesh.position = this.getPosition();
                this.overlay_mesh.position.y += this.mesh.position.y;
                this.overlay_mesh.rotation = this.mesh.rotation;
                this.overlay_mesh.scaling = this.mesh.scaling;
                this.overlay_mesh.overlayColor = Color3.White();
                this.overlay_mesh.renderOverlay = true;
                this.overlay_mesh.isVisible = true;

                // register hover out item
                this.overlay_mesh.actionManager = new ActionManager(this._scene);
                this.overlay_mesh.actionManager.registerAction(
                    new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, (ev) => {
                        //
                        this.overlay_mesh.dispose();
                        //
                        this.mesh.isVisible = true;
                    })
                );
            })
        );*/

        //////////////////////////////////////////////////////////////////////////
        // misc
        this.characterLabel = this._ui.createItemLabel(this);
    }

    public update(delta) {}
    public updateServerRate(delta) {}
    public updateSlowRate(delta) {}

    // basic performance (only enable entities in a range around the player)
    public lod(_currentPlayer) {
        /*
        this.mesh.setEnabled(false);
        this.mesh.freezeWorldMatrix();
        let entityPos = this.getPosition();
        let playerPos = _currentPlayer.position();
        let distanceFromPlayer = Vector3.Distance(playerPos, entityPos);
        if (distanceFromPlayer < Config.PLAYER_VIEW_DISTANCE) {
            this.mesh.unfreezeWorldMatrix();
            this.mesh.setEnabled(true);
        }*/
    }

    public setPosition() {
        this.position = this.getPosition();
    }

    public getPosition() {
        return new Vector3(this.x, this.y, this.z);
    }

    public remove() {
        if (this.characterLabel) {
            this.characterLabel.dispose();
        }
        if (this.mesh) {
            this.mesh.dispose();
        }
    }
}
