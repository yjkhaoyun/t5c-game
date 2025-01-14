import { abilityMap, EntityState, CalculationTypes } from "../../shared/types";

let AbilitiesDB: abilityMap = {
    base_attack: {
        title: "Attack",
        key: "base_attack",
        icon: "ICON_ABILITY_base_attack",
        sound: "enemy_attack_1",
        description: "A unimpressive attack that deals very little damage.",
        castSelf: false,
        castTime: 0,
        cooldown: 1000,
        repeat: 0,
        repeatInterval: 0,
        range: 0,
        minRange: 3,
        animation: EntityState.ATTACK,
        effect: {
            type: "target",
            particule: "damage",
            color: "white",
        },

        affinity: "strength",
        casterPropertyAffected: [],
        targetPropertyAffected: [{ key: "health", type: CalculationTypes.REMOVE, min: 3, max: 6 }],
        requiredToLearn: [],
    },

    fireball: {
        title: "Fireball",
        key: "fireball",
        icon: "ICON_ABILITY_fireball",
        sound: "fire_attack_2",
        description: "Hurls a massive fiery ball that explodes on contact with target.",
        castSelf: false,
        castTime: 1000,
        cooldown: 1000,
        repeat: 0,
        repeatInterval: 0,
        range: 0,
        minRange: 0,
        animation: EntityState.SPELL_CAST,
        effect: {
            type: "travel",
            particule: "fireball",
            color: "orange",
        },

        affinity: "intelligence",
        casterPropertyAffected: [{ key: "mana", type: CalculationTypes.REMOVE, min: 10, max: 10 }],
        targetPropertyAffected: [{ key: "health", type: CalculationTypes.REMOVE, min: 5, max: 10 }],
        requiredToLearn: [{ key: "level", amount: 2 }],
    },

    poisonball: {
        title: "Poison Cloud",
        key: "poisonball",
        icon: "ICON_ABILITY_poisonball",
        sound: "fire_attack_2",
        description: "Trow a bottle of viscous poisonous liquid onto target that will damage target overtime.",
        castSelf: false,
        castTime: 0,
        cooldown: 10000,
        repeat: 5,
        repeatInterval: 1000,
        range: 0,
        minRange: 0,
        animation: EntityState.SPELL_CAST,
        effect: {
            type: "travel",
            particule: "fireball",
            color: "green",
        },
        affinity: "intelligence",
        casterPropertyAffected: [{ key: "mana", type: CalculationTypes.REMOVE, min: 15, max: 15 }],
        targetPropertyAffected: [{ key: "health", type: CalculationTypes.REMOVE, min: 2, max: 4 }],
        requiredToLearn: [
            { key: "level", amount: 3 },
            { key: "intelligence", amount: 25 },
        ],
    },
    heal: {
        title: "Heal",
        key: "heal",
        icon: "ICON_ABILITY_heal",
        sound: "heal_1",
        description: "A spell from ancient times that will leave target feeling fresh & revigorated.",
        castSelf: true,
        castTime: 1000,
        cooldown: 1000,
        repeat: 0,
        repeatInterval: 0,
        range: 0,
        minRange: 0,
        animation: EntityState.SPELL_CAST,
        effect: {
            type: "self",
            particule: "heal",
            color: "white",
        },
        affinity: "wisdom",
        casterPropertyAffected: [{ key: "mana", type: CalculationTypes.REMOVE, min: 10, max: 10 }],
        targetPropertyAffected: [{ key: "health", type: CalculationTypes.ADD, min: 20, max: 30 }],
        requiredToLearn: [
            { key: "level", amount: 5 },
            { key: "intelligence", amount: 25 },
            { key: "wisdom", amount: 35 },
        ],
    },
};

export { AbilitiesDB };
