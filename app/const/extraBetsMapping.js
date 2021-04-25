const SUPERBOWL_WINNER_POINTS = 100;
const CONFERENCE_CHAMPION_POINTS = 50;
const DIVISION_CHAMPION_POINTS = 20;
const WILD_CARD_POINTS = 10;

module.exports = Object.freeze({
    SUPERBOWL: {
        TYPE: 1,
        POINTS: SUPERBOWL_WINNER_POINTS
    },
    AFC_CHAMPION: {
        TYPE: 2,
        POINTS: CONFERENCE_CHAMPION_POINTS
    },
    AFC_NORTH: {
        TYPE: 3,
        POINTS: DIVISION_CHAMPION_POINTS
    },
    AFC_SOUTH: {
        TYPE: 4,
        POINTS: DIVISION_CHAMPION_POINTS
    },
    AFC_EAST: {
        TYPE: 5,
        POINTS: DIVISION_CHAMPION_POINTS
    },
    AFC_WEST: {
        TYPE: 6,
        POINTS: DIVISION_CHAMPION_POINTS
    },
    NFC_CHAMPION: {
        TYPE: 7,
        POINTS: CONFERENCE_CHAMPION_POINTS
    },
    NFC_NORTH: {
        TYPE: 8,
        POINTS: DIVISION_CHAMPION_POINTS
    },
    NFC_SOUTH: {
        TYPE: 9,
        POINTS: DIVISION_CHAMPION_POINTS
    },
    NFC_EAST: {
        TYPE: 10,
        POINTS: DIVISION_CHAMPION_POINTS
    },
    NFC_WEST: {
        TYPE: 11,
        POINTS: DIVISION_CHAMPION_POINTS
    },
    AFC_WILDCARD: {
        TYPE: 12,
        POINTS: WILD_CARD_POINTS
    },
    NFC_WILDCARD: {
        TYPE: 13,
        POINTS: WILD_CARD_POINTS
    }
});