import { Room, Client } from "@colyseus/core";
import { ChatSchema } from './schema/ChatSchema';
import logger = require("../helpers/logger");

import {StateHandlerSchema} from './schema/StateHandlerSchema';
import Config from '../../shared/Config';

export class GameRoom extends Room<StateHandlerSchema> {

    public maxClients = 64;

    onCreate(options: any) {

        console.log("GameRoom created!", options);

        this.roomId = options.location;

        // Set initial state
        this.setState(new StateHandlerSchema());

        // Set the frequency of the patch rate
        // let's make it the same as our game loop
        this.setPatchRate(Config.updateRate);

        // Set the simulation interval callback
        this.setSimulationInterval(dt => {
            this.state.serverTime += dt;
        });

        // set max clients
        this.maxClients = Config.maxClients;

        // initial chat message
        this.broadcast("playerMessage", this.generateMessage("Server", "Hello World"));
        
    }

    onJoin(client: Client, options: any) {

        // let everyone knows someone has joined the game
        this.broadcast("playerMessage", this.generateMessage("Server", "Player "+client.sessionId+" has joined the game.") );

        // add player to server
        console.log(`player ${client.sessionId} joined room ${this.roomId}.`, options);
        this.state.addPlayer(client.sessionId);

        // set location
        this.state.setLocation(client.sessionId, options.location);
        
        // on player input event
        this.onMessage("playerInput", (client, data: any) => {
            this.state.calculatePosition(client.sessionId, data.h, data.v, data.seq);
        });

        // on player chat message
        this.onMessage("playerMessage", (client, message) => {
            this.broadcast("playerMessage", this.generateMessage(client.sessionId, message));
        });

        // on player teleport
        this.onMessage("playerTeleport", (client, location) => {
            console.log('playerTeleport', location);
            this.state.setLocation(client.sessionId, location);
        });

    }

    // When a client leaves the room
    onLeave(client: Client) {
        if(this.state.players.has(client.sessionId)){
            this.broadcast("playerMessage", "Player "+client.sessionId+" has left the game.");
            this.state.removePlayer(client.sessionId);
        }
    }

    // Cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
     onDispose() {
        console.log("Dispose GameRoom");
    }


    /////////////////////////////////////////////////
    /////////////////////////////////////////////////

    // prepare chat message to be sent
    generateMessage(sessionId: string, message = "") {
        let msg = new ChatSchema;
        msg.senderID = sessionId;
        msg.message = message;
        return msg;
    }

    /*
    spawnCube(cubeData: any){
        const cube = new CubeSchema(cubeData).assign(cubeData);
        this.state.cubes.set(cubeData.id, cube);
        return cube;
    }

    initializeWorld() {

        logger.silly(`*** GENERATE WORLD ***`);

        /////////////////////////////////////////////////////////
        // GENERATE MAIN WORLD
        var grid_x = 20;
        var grid_z = 20;
        for (var x = -grid_x; x <= grid_x; x++) {
            for (var z = -grid_z; z <= grid_z; z++) {
                let cubeData = {
                    id: this.generateRandomUUID(),
                    player_uid: 'SERVER',
                    x: x,
                    y: -1,
                    z: z,
                    color: '#EEEEEE',
                    type: 'crate'
                }
                this.spawnCube(cubeData);

                // ADD A BORDER TO THE MAIN WORLD
                cubeData.y = 0;
                if (z === -grid_x) { this.spawnCube(cubeData); }
                if (x === -grid_z) { this.spawnCube(cubeData); }
                if (x === grid_x) { this.spawnCube(cubeData); }
                if (z === grid_z) { this.spawnCube(cubeData); }

            }
        }   

        console.log("Generated Main World with " + (grid_x * grid_z) + " cubes ");
    }
    */


}
