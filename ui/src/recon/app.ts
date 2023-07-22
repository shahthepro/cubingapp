import { type Scene, setPuzzle } from "../lib/scripts/rubiks-viz";
import { Puzzle } from "../lib/scripts/rubiks-viz/puzzle";
import { replaceAll } from "../lib/scripts/util";
import { type PuzzleTypes } from "../lib/scripts/common/scramble";

let callback: (state) => void;

export function setCallback(_callback: (state) => void) {
    callback = _callback;
    return state;
}

type State = {
    scene: Scene,
    setup: string,
    moves: string,
    puzzle: PuzzleTypes,
    moveIndex: number,
    maxMoves: number,
    movesCursor: number,
}

let state: State = {
    scene: {} as Scene,
    setup: "",
    moves: "",
    puzzle: "3x3",
    moveIndex: 0,
    maxMoves: 0,
    movesCursor: 0,
};

let stepper = {} as Stepper;

export function initApp(scene: Scene) {
    state.scene = scene;

    let url = new URL(document.URL);
    state.setup = url.searchParams.get("setup") || "";
    state.moves = url.searchParams.get("moves") || "";
    state.puzzle = (url.searchParams.get("puzzle") as PuzzleTypes) || "3x3";

    setPuzzle(state.scene, state.puzzle);
    updateCubeState(undefined);

    callback(state);
}

export function updateCubeState(event) {
    if (event !== undefined) {
        let start = (event.target as HTMLInputElement).selectionStart;
        state.movesCursor = start ?? 0;
    }

    let { setup, moves, movesCursor } = state;

    movesCursor = getCursorNotInMiddleOfWord(moves, movesCursor);
    let movesPortion = moves.slice(0, movesCursor);
    let parsedAlg = parseAlg(movesPortion);
    
    let puzzle = state.scene.puzzle;

    let invalidMove = findInvalidMove(puzzle, parsedAlg.split(" "));
    if (invalidMove) {
        return;
    }

    puzzle.solve();
    puzzle.performAlg(setup);
    let numMovesPerformed = puzzle.performAlg(parsedAlg);
    stepper = newStepper(state.scene, state.moves, numMovesPerformed);

    state.moveIndex = numMovesPerformed;
    state.maxMoves = stepper.length;
    callback(state);
}

export function copyUrl() {
    let url = new URL(document.URL);
    urlSet(url, "moves", state.moves);
    urlSet(url, "setup", state.setup);
    urlSet(url, "puzzle", state.puzzle, "3x3");

    const urlStr = url.toString();
    navigator.clipboard.writeText(urlStr).then(() => {
        const MAX_LEN = 2048;
        if (urlStr.length > MAX_LEN) {
            alert(`The URL is ${urlStr.length} characters, and some browsers only allow 2048 characters. Make the reconstruction shorter if you want to shorten the url.`);
        }
    });
}

export function prev() {
    if (!stepper.prev()) return;
    callback(state);
}

export function next() {
    if (!stepper.next()) return;
    callback(state);
}

/**
 * If the cursor is in the middle of a word, move it to the start of the word.
 * For example, if the cursor is between F', we don't execute the F.
 */
function getCursorNotInMiddleOfWord(str: string, index: number): number {
    while (middleOfWord(str, index)) {
        index--;
    }
    return index;
}

function middleOfWord(str: string, index: number) {
    if (index <= 0 || index >= str.length) return false;
    const char = str[index];
    return char !== " " && char !== "\t" && char !== "\n";
}

type Stepper = {
    prev: () => boolean,
    next: () => boolean,
    length: number,
}

/**
 * Parse an algorithm string and return a string of space-separated moves.
 * The algorithm may have an arbitrary number of spaces, tabs, and newlines.
 * Comments should be ignored.
 */
function parseAlg(str: string): string {
    let lines = str.split("\n");

    // Filter out empty lines
    lines = lines.filter(line => line.trim().length > 0);
    
    // Ignore comments
    lines = lines.map(line => line.split("//")[0]);

    // Remove tabs remove duplicate spaces, and trim
    lines = lines.map(line => {
        line = replaceAll(line, "\t", " ");
        line = replaceAll(line, "  ", " ");
        return line.trim();
    });

    // Filter out empty lines
    lines = lines.filter(line => line.trim().length > 0);

    // Join lines then split by spaces
    return lines.join(" ").trim();
}

function newStepper(scene: Scene, alg: string, index: number): Stepper {
    let moves = parseAlg(alg).split(" ");

    // If moves = [""], set moves = []
    if (moves.length === 1 && moves[0] === "") moves = [];

    return {
        prev: () => {
            if (index <= 0) return false;
            index--;
            scene.puzzle.performMove(moves[index], false);

            state.moveIndex = index;
            callback(state);

            return true;
        },
        next: () => {
            if (index >= moves.length) return false;
            scene.puzzle.performMove(moves[index], true);
            index++;

            state.moveIndex = index;
            callback(state);

            return true;
        },
        length: moves.length,
    };
}

function findInvalidMove(puzzle: Puzzle, moves: string[]): string | undefined {
    const moveMap = puzzle.getMoveMap(true);
    let invalidMove = moves.find(move => !moveMap[move]);
    return invalidMove;
}

function urlSet(url: URL, key: string, value: string, defaultValue: string = "") {
    if (value && value !== defaultValue) {
        url.searchParams.set(key, value);
    } else {
        url.searchParams.delete(key);
    }
}
