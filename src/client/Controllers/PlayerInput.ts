import { Scene } from "@babylonjs/core/scene";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents";
import { GameController } from "./GameController";

export class PlayerInput {
    public inputMap: {};
    private _scene: Scene;
    private _game: GameController;
    private _gameroom;
    private _ui;

    //simple movement
    public horizontal: number = 0;
    public vertical: number = 0;

    // moving
    public left_click: boolean;
    public right_click: boolean;
    public middle_click: boolean;
    public mouse_moving: boolean = false;
    public left_alt_pressed: boolean = false;

    // moving
    public player_can_move: boolean = false;

    // digits
    public digit_pressed: number = 0;

    public movementX: number = 0;
    public movementY: number = 0;

    constructor(game: GameController, scene, gameroom, ui) {
        (this._game = game), (this._scene = scene);
        this._gameroom = gameroom;
        this._ui = ui;

        // detect mouse movement
        this._scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                if (pointerInfo.event.button == 0) {
                    this.left_click = true;
                }
                if (pointerInfo.event.button == 1) {
                    this.middle_click = true;
                }
                if (pointerInfo.event.button == 2) {
                    this.right_click = true;
                }
            }

            if (pointerInfo.type === PointerEventTypes.POINTERUP) {
                if (pointerInfo.event.button == 0) {
                    this.left_click = false;
                    this.inputMap = { rotY: null };
                    this.vertical = 0;
                    this.horizontal = 0;
                }
                if (pointerInfo.event.button == 1) {
                    this.middle_click = false;
                }
                if (pointerInfo.event.button == 2) {
                    this.right_click = false;
                }
                this.player_can_move = false;
                this.mouse_moving = false;
            }

            if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
                if (this.left_click) {
                    this.player_can_move = true;
                    const x = (pointerInfo.event.clientX / pointerInfo.event.target.width) * 2 - 1;
                    const y = (pointerInfo.event.clientY / pointerInfo.event.target.height) * 2 - 1;
                    this.inputMap = { rotY: Math.atan2(x, y) };
                    this._updateFromMouse(pointerInfo);
                }
                if (this.right_click) {
                    this.mouse_moving = true;
                }

                if (this.middle_click) {
                    this.movementX = pointerInfo.event.movementX / 100;
                    this.movementY = pointerInfo.event.movementY / 75;
                }
            }
        });

        this._scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    if (kbInfo.event.code === "Digit1") {
                        this.digit_pressed = 1;
                    }
                    if (kbInfo.event.code === "Digit2") {
                        this.digit_pressed = 2;
                    }
                    if (kbInfo.event.code === "Digit3") {
                        this.digit_pressed = 3;
                    }
                    if (kbInfo.event.code === "Digit4") {
                        this.digit_pressed = 4;
                    }
                    if (kbInfo.event.code === "Digit5") {
                        this.digit_pressed = 5;
                    }
                    if (kbInfo.event.code === "Digit6") {
                        this.digit_pressed = 6;
                    }
                    if (kbInfo.event.code === "Digit7") {
                        this.digit_pressed = 7;
                    }
                    if (kbInfo.event.code === "Digit8") {
                        this.digit_pressed = 8;
                    }
                    if (kbInfo.event.code === "Digit9") {
                        this.digit_pressed = 9;
                    }
                    if (kbInfo.event.code === "ControlLeft") {
                        this.left_alt_pressed = true;
                    }
                    break;

                case KeyboardEventTypes.KEYUP:
                    if (kbInfo.event.code === "ControlLeft") {
                        this.left_alt_pressed = false;
                    }
                    break;
            }
        });
    }

    //handles what is done when mouse is pressed or moved
    private _updateFromMouse(pointerInfo): void {
        /*
        // prevent player moving while hovering an entity
        if (pointerInfo._pickInfo.pickedMesh && 
            pointerInfo._pickInfo.pickedMesh.metadata && 
            pointerInfo._pickInfo.pickedMesh.metadata !== null && 
            pointerInfo._pickInfo.pickedMesh.metadata.type && 
            pointerInfo._pickInfo.pickedMesh.metadata.type === 'entity'){
            this.player_can_move = false;
        }*/

        //forward - backwards movement
        if (this.inputMap["rotY"] !== null) {
            this.vertical = -Math.cos(this.inputMap["rotY"] + Math.PI - this._game.camY);
            this.horizontal = Math.sin(this.inputMap["rotY"] + Math.PI - this._game.camY);
        }
    }
}
