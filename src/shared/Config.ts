import { nanoid } from "nanoid";
import State from "../client/Screens/Screens"
import { isLocal } from "./Utils";

let Config = {
    
    // general settings
    title: "T5C",
    version: "Version 0.1.9",

    // server settings
    serverUrlLocal: "ws://localhost:3000",
    apiUrlLocal: "http://localhost:3000",
    serverUrlProduction: "wss://t5c.onrender.com",
    apiUrlProduction: "https://t5c.onrender.com",
    maxClients: 20, // set maximum clients per room
    updateRate: 100, // Set frequency the patched state should be sent to all clients, in milliseconds 
    databaseUpdateRate: 1000, // the frequency at which server save players position
    logLevel: "info",

    // database settings
    databaseLocation: './database.db',

    // game settings
    PLAYER_NAMEPLATE_TIMEOUT: 15000, // 15 seconds
    PLAYER_VIEW_DISTANCE: 20,
    MONSTER_RESPAWN_RATE: 10000,
    MONSTER_AGGRO_DISTANCE: 6,
    MONSTER_ATTACK_DISTANCE: 2,

    // players settings
    PLAYER_SPEED: 0.55,
    PLAYER_START_HEALTH: 100,
    PLAYER_START_LEVEL: 1,

    // basic locations
    initialLocation: "lh_town",
    locations: {
        "lh_town": {
            title: "Town",
            key: 'lh_town',
            mesh: "lh_town.glb",
            sun: true,
            sunIntensity: 2,
            spawnPoint: {
                x: 7.50,
                y: 0,
                z: -14.27,
                rot: -180
            },
        },
        "lh_dungeon_01": {
            title: "Dungeon Level 1",
            key: 'lh_dungeon_01',
            mesh: "lh_dungeon_01.glb",
            sun: false,
            sunIntensity: 0.5,
            spawnPoint: {
                x: 11.33,
                y: 0,
                z: -2.51,
                rot: -180
            },
        },
    },

    // entities 
    entities: {
        "player_hobbit": {
            name: "loading...",
            speed: 0.3,
            scale: 0.02,
            animationSpeed: 1.3,
            animations: {
                "IDLE": 3,
                "WALK": 6,
                "ATTACK": 0,
                "DEATH": 5,
                "DAMAGE": 1
            },
        },
        "monster_bear": {
            name: "Bear",
            speed: 0.2,
            scale: 0.02,
            rotationFix: 3.14,
            animationSpeed: 1,
            animations: {
                "IDLE": 0,
                "WALK": 3,
                "ATTACK": 2,
                "DEATH": 4,
                "DAMAGE": 5
            },
        },
        "monster_unicorn": {
            name: "Unicorn",
            speed: 0.3,
            scale: 0.0125,
            rotationFix: 3.14,
            animationSpeed: 1,
            animations: {
                "IDLE": 5,
                "WALK": 6,
                "ATTACK": 0,
                "DEATH": 3,
                "DAMAGE": 5
            },
        },
    },

    // functions
    setDefault(){
        global.T5C = {
            nextScene: isLocal() ? State.GAME : State.LOGIN,
            //nextScene: State.LOGIN,
            currentRoomID: "",
            currentSessionID: "",
            currentLocation: Config.locations[Config.initialLocation],
            currentUser: false,
            currentMs: 0
        }
    },

    checkForSceneChange(){
        let currentScene = global.T5C.nextScene;
        if(global.T5C.nextScene != State.NULL){
            global.T5C.nextScene = State.NULL;
            return currentScene;  
        }
    },

    goToScene(newState: State){
        global.T5C.nextScene = newState;
    }

}

export default Config