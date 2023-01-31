type raceData = {
    name: string,
    speed: number,
    scale: number,
    rotationFix: number,
    animationSpeed: number,
    animations: {
        [key: string]: number
    },
    maxHealth: number,
    healthRegen: number,
    maxMana: number,
    manaRegen: number,
    abilities: {
        [key: number]: string
    }
};

interface raceDataMap {
    [key: string]: raceData
 }

let Races:raceDataMap = {
    "player_hobbit": {
        name: "loading...",
        speed: 0.3,
        scale: 0.02,
        rotationFix: 0,
        animationSpeed: 1.3,
        animations: {
            "IDLE": 3,
            "WALK": 6,
            "ATTACK": 0,
            "DEATH": 2,
            "DAMAGE": 1
        },
        maxHealth: 100,
        healthRegen: 0.2,
        maxMana: 100,
        manaRegen: 0.4, // per second
        abilities: {
            1: 'fireball',
            2: 'heal'
        }
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
        maxHealth: 200,
        healthRegen: 0.2,
        maxMana: 100,
        manaRegen: 0.4, // per second
        abilities: {}
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
        maxHealth: 100,
        healthRegen: 0.2,
        maxMana: 100,
        manaRegen: 0.4, // per second
        abilities: {}
    },
};

export default Races