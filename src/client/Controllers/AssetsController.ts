import { Scene } from "@babylonjs/core/scene";
import { CascadedShadowGenerator } from "@babylonjs/core/Lights/Shadows/cascadedShadowGenerator";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import loadNavMeshFromString from "../Utils/loadNavMeshFromString";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { WaterMaterial } from "@babylonjs/materials/water";
import { Sound } from "@babylonjs/core/Audio/sound";
import {
    AssetsManager,
    BinaryFileAssetTask,
    ContainerAssetTask,
    CubeTextureAssetTask,
    HDRCubeTextureAssetTask,
    ImageAssetTask,
    MeshAssetTask,
    TextFileAssetTask,
    TextureAssetTask,
} from "@babylonjs/core/Misc/assetsManager";
import { GameController } from "./GameController";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

type AssetEntry = {
    name: string;
    filename: string;
    extension: string;
    type: string;
    instantiate?: boolean;
};

export class AssetsController {
    private _game: GameController;
    private _assetsManager: AssetsManager;

    private assetDatabase: AssetEntry[] = [];
    private assetToPreload: AssetEntry[] = [];

    public allMeshes;
    private _loadingTxt;
    private _auth;

    constructor(game) {
        this._game = game;
        this._loadingTxt = window.document.getElementById("loadingTextDetails");

        // Assets manager
        this._assetsManager = new AssetsManager(this._game.scene);

        // set list of assets
        this.assetDatabase = [
            // sounds
            /*
            { name: "SOUND_enemy_attack_1", filename: "enemy_attack_1.wav", extension: "wav" },
            { name: "SOUND_enemy_attack_2", filename: "enemy_attack_2.wav", extension: "wav" },
            { name: "SOUND_fire_attack_1", filename: "fire_attack_1.wav", extension: "wav" },
            { name: "SOUND_fire_attack_2", filename: "fire_attack_2.wav", extension: "wav" },
            { name: "SOUND_heal_1", filename: "heal_1.wav", extension: "wav" },
            { name: "MUSIC_01", filename: "music.mp3", extension: "mp3" },
            { name: "SOUND_player_walking", filename: "player_walking.wav", extension: "wav", instantiate: false },*/

            // textures
            { name: "TXT_selected_circle_green", filename: "selected_circle_green.png", extension: "png", type: "texture" },
            { name: "TXT_decal_target", filename: "decal_target.png", extension: "png", type: "texture" },
            { name: "TXT_particle_01", filename: "particle_01.png", extension: "png", type: "texture" },
        ];

        // add locations
        /*
        let locations = this._game.loadGameData("locations");
        if (locations) {
            for (let key in locations) {
                let el = locations[key];
                this.assetDatabase.push({ name: "ENV_" + el.key, filename: "environment/" + el.mesh + ".glb", extension: "glb", type: "mesh" });
            }
        }*/

        // add abilities (icons)
        let abilities = this._game.loadGameData("abilities");
        if (abilities) {
            for (let key in abilities) {
                let el = abilities[key];
                this.assetDatabase.push({ name: el.icon, filename: "icons/" + el.icon + ".png", extension: "png", type: "image" });
            }
        }

        // add items (icons & mesh)
        let items = this._game.loadGameData("items");
        if (items) {
            for (let key in items) {
                let el = items[key];
                this.assetDatabase.push({ name: el.icon, filename: "icons/" + el.icon + ".png", extension: "png", type: "image" });
                this.assetDatabase.push({ name: "ITEM_" + el.key, filename: "items/" + el.key + ".glb", extension: "glb", type: "mesh", instantiate: true });
            }
        }

        // add races (mesh)
        let races = this._game.loadGameData("races");
        if (races) {
            for (let key in races) {
                let el = races[key];
                this.assetDatabase.push({ name: "RACE_" + el.key, filename: "races/" + el.key + ".glb", extension: "glb", type: "mesh", instantiate: true });
                this.assetDatabase.push({ name: el.icon, filename: "portrait/" + el.icon + ".png", extension: "png", type: "image" });
            }
        }
    }

    private showLoadingMessage(msg) {
        if (this._loadingTxt) {
            this._loadingTxt.innerHTML = msg;
        }
    }

    public async loadNavMesh() {
        this.showLoadingMessage("navmesh: loading");
        let navmesh = await loadNavMeshFromString(this._auth.currentLocation.key);
        this.showLoadingMessage("navmesh: loaded");
        return navmesh;
    }

    public async loadLevel(key) {
        this.assetToPreload = this.assetDatabase;
        this.assetToPreload.push({ name: "ENV_" + key, filename: "environment/" + key + ".glb", extension: "glb", type: "mesh" });
        await this.preloadAssets();
        await this.prepareLevel(key);
        await this.prepareTextures();
    }

    public async fetchAsset(key) {
        // is asset is database
        let entry = this.assetDatabase.find((el: AssetEntry) => {
            if (el.name === key) {
                return true;
            }
            return false;
        });

        if (!entry) {
            console.error("Asset not found", key);
            return false;
        }

        // if asset already load, return immediately
        if (this._game._loadedAssets[key]) {
            //console.log("Asset already loaded", key);
            return this._game._loadedAssets[key];
        }

        // preload asset
        this.assetToPreload.push(entry);
        await this.preloadAssets();
    }

    public async preloadAssets() {
        let assetLoaded: any[] = [];
        this.assetToPreload.forEach((obj) => {
            let assetTask;
            switch (obj.extension) {
                case "png":
                case "jpg":
                case "jpeg":
                case "gif":
                    if (obj.type === "texture") {
                        assetTask = this._assetsManager.addTextureTask(obj.name, "./textures/" + obj.filename);
                    } else if (obj.type === "image") {
                        assetTask = this._assetsManager.addImageTask(obj.name, "./images/" + obj.filename);
                    }
                    break;

                case "dds":
                    assetTask = this._assetsManager.addCubeTextureTask(obj.name, "./images/" + obj.filename);
                    break;

                case "hdr":
                    assetTask = this._assetsManager.addHDRCubeTextureTask(obj.name, "./images/" + obj.filename, 512);
                    break;

                case "mp3":
                case "wav":
                    assetTask = this._assetsManager.addBinaryFileTask(obj.name, "./sounds/" + obj.filename);
                    break;

                case "babylon":
                case "gltf":
                case "glb":
                case "obj":
                    if (obj.instantiate) {
                        assetTask = this._assetsManager.addContainerTask(obj.name, "", "", "./models/" + obj.filename);
                    } else {
                        assetTask = this._assetsManager.addMeshTask(obj.name, "", "", "./models/" + obj.filename);
                    }
                    break;

                case "json":
                case "txt":
                    assetTask = this._assetsManager.addTextFileTask(obj.name, "./data/" + obj.filename);
                    break;

                default:
                    console.error('Error loading asset "' + obj.name + '". Unrecognized file extension "' + obj.extension + '"');
                    break;
            }

            assetTask.onSuccess = (task) => {
                switch (task.constructor) {
                    case TextureAssetTask:
                    case CubeTextureAssetTask:
                    case HDRCubeTextureAssetTask:
                        assetLoaded[task.name] = task.texture;
                        break;
                    case ImageAssetTask:
                        assetLoaded[task.name] = task.url;
                        break;
                    case BinaryFileAssetTask:
                        assetLoaded[task.name] = task.data;
                        break;
                    case ContainerAssetTask:
                        assetLoaded[task.name] = task.loadedContainer;
                        break;
                    case MeshAssetTask:
                        assetLoaded[task.name] = task;
                        break;
                    case TextFileAssetTask:
                        assetLoaded[task.name] = task.text;
                        break;
                    default:
                        console.error('Error loading asset "' + task.name + '". Unrecognized AssetManager task type.');
                        break;
                }
            };

            assetTask.onError = (task, message, exception) => {
                console.log(message, exception);
            };
        });

        this._assetsManager.onProgress = (remainingCount, totalCount, lastFinishedTask) => {
            let loadingMsg = (((totalCount - remainingCount) / totalCount) * 100).toFixed(0) + "%";
            this.showLoadingMessage(loadingMsg);
        };

        this._assetsManager.onFinish = () => {
            console.log("loading complete", assetLoaded);
            for (let i in assetLoaded) {
                this._game._loadedAssets[i] = assetLoaded[i];
            }
            this.showLoadingMessage("100%");
        };

        await this._assetsManager.loadAsync();
    }

    public prepareTextures() {
        // debug circle inaactive
        var material = new StandardMaterial("debug_entity_neutral");
        material.diffuseColor = new Color3(0, 1, 0);
        material.alpha = 0.1;

        // debug circle active
        var material = new StandardMaterial("debug_entity_active");
        material.diffuseColor = new Color3(1.0, 0, 0);
        material.alpha = 0.1;

        // entity selected circle
        var texture = this._game._loadedAssets["TXT_selected_circle_green"];
        texture.hasAlpha = true;
        var material = new StandardMaterial("entity_selected");
        material.diffuseTexture = texture;
        material.useAlphaFromDiffuseTexture = true;

        // entity selected circle
        var texture = this._game._loadedAssets["TXT_decal_target"];
        texture.hasAlpha = true;
        var material = new StandardMaterial("decal_target");
        material.diffuseTexture = texture;
        material.useAlphaFromDiffuseTexture = true;
        material.zOffset = -2;
    }

    //What we do once the environment assets have been imported
    //handles setting the necessary flags for collision and trigger meshes,
    public async prepareLevel(key) {
        /*
        if (this._game.currentLocation.waterPlane) {
            // Water
            var waterMesh = CreateGround("waterMesh", { width: 512, height: 512, subdivisions: 32 }, this._game.scene);
            waterMesh.position = new Vector3(0, -4, 0);

            var water = new WaterMaterial("water", this._game.scene);
            water.bumpTexture = new Texture("textures/waterbump.jpg", this._game.scene);

            // Water properties
            water.backFaceCulling = true;
            water.windForce = 0.1;
            water.waveHeight = 0.6;
            water.bumpHeight = 0.5;
            water.waterColor = Color3.FromInts(0, 157, 255);
            water.colorBlendFactor = 0.5;
            waterMesh.material = water;
        }

        // start  music
        /*
        let soundData = this._loadedAssets['music'];
        let sound = new Sound("music", soundData, this._scene, function(){ sound.play() }, {
            volume: 0.3
        });*/
        // instantiate the scene

        let assetKey = "ENV_" + key;
        this.allMeshes = this._game._loadedAssets[assetKey].loadedMeshes;

        //Loop through all environment meshes that were imported
        this.allMeshes.forEach((m: Mesh) => {
            // default values
            m.checkCollisions = false;
            m.isPickable = true;
            m.receiveShadows = true;
            m.metadata = {
                type: "environment",
            };
        });
    }
}
