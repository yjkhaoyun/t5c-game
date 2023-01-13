import { Schema, type, MapSchema } from '@colyseus/schema';
import { EntityState } from "./EntityState";
import { PlayerCharacter } from '../../../shared/types';
import { GameRoom } from '../GameRoom';
import { EntityCurrentState } from '../../../shared/Entities/Entity/EntityCurrentState';
import { NavMesh, EntityManager, Time, Vector3 } from "../../../shared/yuka";
import { nanoid } from 'nanoid';
import Config from '../../../shared/Config';
import Logger from "../../../shared/Logger";
import { randomNumberInRange } from '../../../shared/Utils';

enum AI_STATE { 
    IDLE = 0, 
    WALKING = 1
}

export class GameRoomState extends Schema {

    // networked variables
    @type({ map: EntityState }) entities = new MapSchema<EntityState>();
    @type("number") serverTime: number = 0.0;
    
    // not networked variables
    private _gameroom: GameRoom = null;
    private navMesh: NavMesh = null;
    private timer: number = 0;
    private spawnTimer: number = 0;

    constructor(gameroom: GameRoom, _navMesh: NavMesh, ...args: any[]) {
		super(...args);
		this._gameroom = gameroom;
		this.navMesh = _navMesh;
	}

    public createEntity(){

        // monster pool to chose from
        let monsterTypes = ['monster_unicorn', 'monster_bear'];

        // random id
        let sessionId = nanoid();

        // get starting starting position
        let randomRegion = this.navMesh.getRandomRegion();
        let point = randomRegion.centroid;

        // random mesh
        let race = monsterTypes[Math.floor(Math.random()*monsterTypes.length)];

        // get race data
        let raceData = Config.entities[race];

        // create entity
        let data = {
            sessionId: sessionId,
            type: 'entity',
            race: race,
            name: raceData.name,
            location: this._gameroom.metadata.location,
            x: point.x,
            y: 0,
            z: point.y,
            rot: randomNumberInRange(0, Math.PI), 
            health: 100,
            level: 1,
            state: EntityCurrentState.IDLE,
            toRegion: false,
            config: raceData
        };

        let entity = new EntityState(this._gameroom).assign(data);

        entity.setRandomDestination(point);

        // add to colyseus state
        this.entities.set(sessionId, entity);

        // log
        Logger.info("[gameroom][state][createEntity] created new entity "+race+": "+sessionId);
    }

    public update(deltaTime: number) {

        //////////////////////////////////////////////
        // entity spawning script (span a monster every .5 second)
        this.spawnTimer += deltaTime;
        let spawnTime = 300;
        if (this.spawnTimer >= spawnTime) {
            this.spawnTimer = 0;
            let maxEntities = 100;
            if(this.entities.size < maxEntities){
                this.createEntity();
            }
        }

        //////////////////////////////////////////////
        // entity moving script 
        this.timer += deltaTime;
        let refreshRate = 100;
        if (this.timer >= refreshRate) {
            this.timer = 0;

            // for each entity
            if( this.entities.size > 0){
                this.entities.forEach(entity => { 

                    // player specific related 
                    if(entity.type === 'player'){

                        // move entity
                        if(entity.toRegion && entity.destinationPath && entity.destinationPath[0]){

                            // get next waypoint
                            let destinationOnPath = entity.destinationPath[0];
                            let speed = 0.5;

                            // save current position
                            let currentPos = new Vector3(entity.x, entity.y, entity.z);

                            // calculate next position towards destination
                            let updatedPos = entity.moveTo(currentPos, destinationOnPath, speed);

                            // if cannot move to position, clear destination
                            if (entity.canMoveTo(currentPos, updatedPos) === null){

                                entity.resetDestination();

                            // else move entity to new position
                            }else{

                                // set new position
                                entity.setPosition(updatedPos);
                                
                                // calculate rotation
                                entity.rot = entity.calculateRotation(currentPos, updatedPos);

                                // check if arrived at waypoint
                                destinationOnPath.y = 0;
                                if(destinationOnPath.equals(updatedPos)){
                                    entity.destinationPath.shift(); // entity arrived at waypint, remove waypoint from array
                                }

                            }

                        }else{

                            // something is wrong, let's look for a new destination
                            entity.resetDestination();
                        }

                    }

                    // only move non playing entities
                    if(entity.type === 'entity'){

                        // only find a new AI_STATE if AI_STATE_REMAINING_DURATION is at zero
                        if(entity.AI_STATE_REMAINING_DURATION === 0 || entity.AI_STATE_REMAINING_DURATION < 0){
                            entity.AI_CURRENT_STATE = Math.random() < 0.5 ? AI_STATE.IDLE : AI_STATE.WALKING;
                            entity.AI_STATE_REMAINING_DURATION = (Math.random() * 5000); // change state every 3 seconds
                        }

                        // calculate new state duration
                        entity.AI_STATE_REMAINING_DURATION -= Math.random() * 100 + 10;

                        // save current position
                        let currentPos = new Vector3(entity.x, entity.y,entity.z);

                        // if entity does not have a destination, find one
                        if(!entity.toRegion){
                            entity.setRandomDestination(currentPos);
                        }

                        // move entity
                        if(
                            entity.destinationPath.length > 0 && 
                            entity.health > 0 && 
                            entity.AI_CURRENT_STATE === AI_STATE.WALKING
                            ){

                            // get next waypoint
                            let destinationOnPath = entity.destinationPath[0];
                            destinationOnPath.y = 0;
                            let speed = entity.config.speed;

                            // calculate next position towards destination
                            let updatedPos = entity.moveTo(currentPos, destinationOnPath, speed);
                            entity.setPosition(updatedPos);

                            // calculate rotation
                            entity.rot = entity.calculateRotation(currentPos, updatedPos);

                            //Logger.info("[gameroom][state][update] moved entity: "+entity.sessionId);

                            // check if arrived at waypoint
                            if(destinationOnPath.equals(updatedPos)){
                                entity.destinationPath.shift();
                            }


                        }else{

                            // something is wrong, let's look for a new destination
                            entity.resetDestination();

                        }
                    }
        
                });
            }
        }
        
	}

    /**
     * Add player
     * @param sessionId 
     * @param data 
     */
    addEntity(sessionId: string, data: PlayerCharacter):void {
        this.entities.set(sessionId, new EntityState(this._gameroom).assign({
            id: data.id,
            sessionId: sessionId,
            type: 'player',
            race: 'player_hobbit',
            name: data.name,
            location: data.location,
            x: data.x,
            y: data.y,
            z: data.z,
            rot: data.rot,
            health: data.health,
            level: data.level,
            experience: data.experience,
            state: EntityCurrentState.IDLE
        }));
    }

    removeEntity(sessionId: string) {
        this.entities.delete(sessionId);
    }

}