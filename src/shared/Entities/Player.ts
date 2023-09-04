import { Scene } from "@babylonjs/core/scene";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";

import { NavMesh } from "../yuka-min";
import { Room } from "colyseus.js";

import { PlayerSchema } from "../../server/rooms/schema/PlayerSchema";
import { PlayerCamera } from "./Player/PlayerCamera";
import { EntityUtils } from "./Entity/EntityUtils";
import { EntityActions } from "./Entity/EntityActions";
import { Entity } from "./Entity";
import { PlayerInput } from "../../client/Controllers/PlayerInput";
import { UserInterface } from "../../client/Controllers/UserInterface";
import Config from "../Config";
import State from "../../client/Screens/Screens";
import { EntityState } from "./Entity/EntityState";
import { AuthController } from "../../client/Controllers/AuthController";
import { dataDB } from "../Data/dataDB";
import { SceneController } from "../../client/Controllers/Scene";
import { Ability } from "../Data/AbilitiesDB";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

export class Player extends Entity {
    public input;
    public interval;
    private _auth: AuthController;

    public isCasting: boolean = false;
    public castingDigit: number = 0;
    public castingTimer;
    public castingElapsed: number = 0;
    public castingTarget: number = 0;
    public ability_in_cooldown;

    public player_data;
    public moveDecal;

    constructor(
        entity: PlayerSchema,
        room: Room,
        scene: Scene,
        ui: UserInterface,
        shadow: CascadedShadowGenerator,
        navMesh: NavMesh,
        _loadedAssets: any[],
        input: PlayerInput
    ) {
        super(entity, room, scene, ui, shadow, navMesh, _loadedAssets);

        this._input = input;

        this.ability_in_cooldown = [false, false, false, false, false, false, false, false, false, false, false];

        this._auth = AuthController.getInstance();

        this.type = "player";

        this.spawnPlayer(input);
    }

    private async spawnPlayer(input) {
        //spawn
        this.utilsController = new EntityUtils(this._scene, this._room);
        this.cameraController = new PlayerCamera(this);
        this.actionsController = new EntityActions(this._scene, this._loadedAssets);

        // add mesh to shadow generator
        this._shadow.addShadowCaster(this.meshController.playerMesh, true);

        ///////////////////////////////////////////////////////////
        // entity network event
        // colyseus automatically sends entity updates, so let's listen to those changes

        // register server messages
        this.registerServerMessages();

        // mouse events
        this._scene.onPointerObservable.add((pointerInfo: any) => {
            // on left mouse click
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 0) {
                this.leftClick(pointerInfo);
            }

            // on right mouse click
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 2) {
                /////////////////////////////////////////////////////////////////////
                // display nameplate for a certain time for any entity right clicked
                if (
                    pointerInfo._pickInfo.pickedMesh &&
                    pointerInfo._pickInfo.pickedMesh.metadata &&
                    pointerInfo._pickInfo.pickedMesh.metadata.sessionId &&
                    pointerInfo._pickInfo.pickedMesh.metadata.sessionId != this._room.sessionId
                ) {
                    let targetMesh = pointerInfo._pickInfo.pickedMesh;
                    let targetData = targetMesh.metadata;
                    let target = this.ui._entities[targetData.sessionId];
                    target.characterLabel.isVisible = true;
                    setTimeout(function () {
                        target.characterLabel.isVisible = false;
                    }, Config.PLAYER_NAMEPLATE_TIMEOUT);
                }
            }

            // on wheel mouse
            if (pointerInfo.type === PointerEventTypes.POINTERWHEEL) {
                /////////////////////////////////////////////////////////////////////
                // camera zoom on mouse wheel
                this.cameraController.zoom(pointerInfo.event.deltaY);
            }

            // check if selected entity is too far
            // todo: should be done on server side?
            if (global.T5C.selectedEntity && global.T5C.selectedEntity.sessionId) {
                let currentPos = this.getPosition();
                let targetPos = global.T5C.selectedEntity.getPosition();
                let distanceBetween = Vector3.Distance(currentPos, targetPos);
                if (distanceBetween > Config.PLAYER_LOSE_FOCUS_DISTANCE) {
                    global.T5C.selectedEntity = null;
                }
            }
        });

        //////////////////////////////////////////////////////////////////////////
        // player before render loop
        this._scene.registerBeforeRender(() => {
            // move camera as player moves
            this.cameraController.follow(this.mesh.position, this.mesh.rotation.y);
        });
    }

    public leftClick(pointerInfo) {
        if (!pointerInfo._pickInfo.pickedMesh) return false;

        if (!pointerInfo._pickInfo.pickedMesh.metadata) return false;

        if (pointerInfo._pickInfo.pickedMesh.metadata === null) return false;

        let metadata = pointerInfo._pickInfo.pickedMesh.metadata;
        console.log(metadata, pointerInfo._pickInfo);

        // select entity
        if (metadata.type === "player" || metadata.type === "entity") {
            let targetSessionId = metadata.sessionId;
            let target = this.ui._entities[targetSessionId];
            global.T5C.selectedEntity = target;
        }

        // pick up item
        if (metadata.type === "item") {
            this._room.send("pickup_item", metadata.sessionId);
        }

        // move to clicked point
        if (metadata.type === "environment") {
            let destination = pointerInfo._pickInfo.pickedPoint;
            let pickedMesh = pointerInfo._pickInfo.pickedMesh;

            // remove decal if already exist
            if (this.moveDecal) {
                this.moveDecal.dispose();
            }

            // add decal to show destination
            var decalMaterial = this._scene.getMaterialByName("decal_target");
            this.moveDecal = MeshBuilder.CreateDecal("decal", pickedMesh, { position: destination });
            this.moveDecal.material = decalMaterial;

            // send to server
            this._room.send("move_to", {
                x: destination._x,
                y: destination._y,
                z: destination._z,
            });
        }
    }

    public updateSlowRate() {}

    // update at engine rate
    public update(delta) {
        if (this && this.moveController) {
            // global camera rotation
            global.T5C.camY = this.cameraController._camRoot.rotation.y;

            // tween entity
            this.moveController.tween();
        }
    }

    // update at server rate
    public updateServerRate(delta) {
        /*
        // only show meshes close to us
        let currentPos = this.getPosition();
        let key = "ENV_" + this._auth.currentLocation.mesh;
        let allMeshes = this._loadedAssets[key].loadedMeshes;
        allMeshes.forEach((element) => {
            let distanceTo = Vector3.Distance(element.position, currentPos);
            console.log(element, element.name, distanceTo);
            if (distanceTo > 5) {
                element.isVisible = false;
            } else {
                element.isVisible = true;
            }
        });*/

        // if digit pressed
        if (this._input.digit_pressed > 0 && !this.isCasting) {
            // get all necessary vars
            let digit = this._input.digit_pressed;
            let target = global.T5C.selectedEntity;

            // send to server
            this._room.send("entity_ability_key", {
                senderId: this._room.sessionId,
                targetId: target ? target.sessionId : false,
                digit: digit,
            });

            // clear digit
            this._input.digit_pressed = 0;
        }

        // check if casting
        if (this.isCasting === true) {
            // increment casting timer
            this.ui._CastingBar.open();
            this.castingElapsed += delta; // increment casting timer by server delta
            let widthInPercentage = ((this.castingElapsed / this.castingTarget) * 100) / 100; // percentage between 0 and 1
            let text = this.castingElapsed + "/" + this.castingTarget;
            let width = widthInPercentage;
            this.ui._CastingBar.update(text, width);
        }

        // check for cooldowns  (estethic only as server really controls cooldowns)
        this.ability_in_cooldown.forEach((cooldown, digit) => {
            if (cooldown > 0) {
                let cooldownUI = this.ui._playerUI.getControlByName("ability_" + digit + "_cooldown");
                let ability = this.getAbilityByDigit(digit) as Ability;
                if (ability) {
                    this.ability_in_cooldown[digit] -= delta;
                    let percentage = ((this.ability_in_cooldown[digit] / ability.cooldown) * 100) / 100;
                    cooldownUI.height = percentage;
                }
            }
        });

        if (!this.isDeadUI && this.health < 1) {
            this.ui._RessurectBox.open();
            this.cameraController.bw(true);
            this.isDeadUI = true;
            console.log("DEAD");
        }

        if (this.isDeadUI && this.health > 1) {
            this.cameraController.bw(false);
            this.ui._RessurectBox.close();
            this.isDeadUI = false;
            console.log("ALIVE");
        }
    }

    public getAbilityByDigit(digit): Ability | boolean {
        let found = false;
        this.player_data.abilities.forEach((element) => {
            if (element.digit === digit) {
                found = dataDB.get("ability", element.key);
            }
        });
        return found;
    }

    // player is casting
    public startCasting(data) {
        let digit = data.digit;
        let ability = this.getAbilityByDigit(digit) as Ability;
        if (ability) {
            this.isCasting = true;
            this.castingElapsed = 0;
            this.castingTarget = ability.castTime;
            this.castingDigit = digit;
            this.ui._CastingBar.open();
        }
    }

    // player cancel casting
    public stopCasting(data) {
        this.isCasting = false;
        this.castingElapsed = 0;
        this.castingTarget = 0;
        this.castingDigit = 0;
        this.ui._CastingBar.close();
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // server message handler

    public registerServerMessages() {
        this._room.onMessage("notification", (data) => {
            this.ui._ChatBox.addNotificationMessage(data.type, data.message, data.message);
        });

        // on teleport confirmation
        this._room.onMessage("playerTeleportConfirm", (location) => {
            console.log(location);
            this.teleport(location);
        });

        // server confirm player can start casting
        this._room.onMessage("ability_start_casting", (data) => {
            this.startCasting(data);
        });

        this._room.onMessage("ability_cancel_casting", (data) => {
            this.stopCasting(data);
        });

        // server confirms ability can be cast
        this._room.onMessage("entity_ability_cast", (data) => {
            let digit = data.digit;
            let ability = this.getAbilityByDigit(digit) as Ability;
            if (ability) {
                // if you are sender, cancel casting and strat cooldown on client
                if (data.fromId === this.sessionId) {
                    // cancel casting
                    this.castingElapsed = 0;
                    this.castingTarget = 0;
                    this.isCasting = false;
                    this.ui._CastingBar.close();
                    this.ability_in_cooldown[digit] = ability.cooldown; // set cooldown
                }

                // action ability
                this.actionsController.process(this, data, ability);
            }
        });
    }

    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////
    // to refactor

    public async teleport(location) {
        // Removes onMessage, onStateChange, onLeave and onError listeners.

        // leave colyseus room
        await this._room.leave();

        // update auth data
        let character = this._auth.currentCharacter;
        character.location = location;
        this._auth.setCharacter(character);

        // switch scene
        SceneController.goToScene(State.GAME);
    }
}
