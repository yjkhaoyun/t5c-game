import {Schema, type, MapSchema} from '@colyseus/schema';
import {PlayerSchema} from './PlayerSchema';

export class StateHandlerSchema extends Schema {

    @type({map: PlayerSchema})
    players = new MapSchema<PlayerSchema>();
    @type("number") serverTime: number = 0.0;

    addPlayer(sessionId: string) {
        let min = -10;
        let max = 10;
        this.players.set(sessionId, new PlayerSchema().assign({
            sessionId: sessionId,
            username: sessionId,
            x: Math.floor(Math.random() * (max - min + 1)) + min,
            y: 0,
            z: Math.floor(Math.random() * (max - min + 1)) + min,
            rot: 0,
        }));
    }

    getPlayer(sessionId: string): PlayerSchema {
        return this.players.get(sessionId);
    }

    removePlayer(sessionId: string) {
        this.players.delete(sessionId);
    }

    setPosition(sessionId: string, x: number, y: number, z: number, rotation: number) {
        const player = this.getPlayer(sessionId);
        player.x = x;
        player.y = y;
        player.z = z;
        player.rot = rotation;
    }

    generateRandomUUID(){
        return Math.random().toString().substring(10,20);
    }

}