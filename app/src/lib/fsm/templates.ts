/**
 * FSM Templates Library
 * 
 * Provides pre-configured FSM templates for common patterns
 * to help users get started quickly.
 */

import { FSM, createEmptyFSM, createState, createTransition, FSMSignal } from './types';
import { v4 as uuidv4 } from 'uuid';

export interface FSMTemplate {
    id: string;
    name: string;
    description: string;
    create: () => FSM;
}

/**
 * Traffic Light Controller Template
 * Basic 3-state sequence with timer-based transitions
 */
export const createTrafficLightFSM = (): FSM => {
    const fsm = createEmptyFSM('traffic_light_controller');

    // Inputs
    const clk: FSMSignal = { name: 'clk', width: 1, direction: 'input' };
    const rst: FSMSignal = { name: 'rst', width: 1, direction: 'input' };
    const timer: FSMSignal = { name: 'timer_done', width: 1, direction: 'input' };
    fsm.inputs.push(timer);

    // Outputs
    const red: FSMSignal = { name: 'red', width: 1, direction: 'output', defaultValue: "1'b0" };
    const yellow: FSMSignal = { name: 'yellow', width: 1, direction: 'output', defaultValue: "1'b0" };
    const green: FSMSignal = { name: 'green', width: 1, direction: 'output', defaultValue: "1'b0" };
    fsm.outputs.push(red, yellow, green);

    // States
    const sRed = createState(uuidv4(), 'RED', { x: 100, y: 100 }, true);
    sRed.outputs = [{ signal: 'red', value: "1'b1" }];

    const sGreen = createState(uuidv4(), 'GREEN', { x: 300, y: 100 }, false);
    sGreen.outputs = [{ signal: 'green', value: "1'b1" }];

    const sYellow = createState(uuidv4(), 'YELLOW', { x: 200, y: 300 }, false);
    sYellow.outputs = [{ signal: 'yellow', value: "1'b1" }];

    fsm.states = [sRed, sGreen, sYellow];

    // Transitions
    fsm.transitions = [
        createTransition(uuidv4(), sRed.id, sGreen.id, 'timer_done'),
        createTransition(uuidv4(), sGreen.id, sYellow.id, 'timer_done'),
        createTransition(uuidv4(), sYellow.id, sRed.id, 'timer_done'),
    ];

    return fsm;
};

/**
 * Sequence Detector (101) Template
 * Moore machine detecting sequence '101'
 */
export const createSequenceDetectorFSM = (): FSM => {
    const fsm = createEmptyFSM('sequence_detector_101');

    // Inputs
    const data: FSMSignal = { name: 'data_in', width: 1, direction: 'input' };
    fsm.inputs.push(data);

    // Outputs
    const detected: FSMSignal = { name: 'sequence_found', width: 1, direction: 'output', defaultValue: "1'b0" };
    fsm.outputs.push(detected);

    // States
    const sIDLE = createState(uuidv4(), 'IDLE', { x: 100, y: 200 }, true); // Initial
    const sGOT1 = createState(uuidv4(), 'GOT_1', { x: 250, y: 100 }, false); // Saw 1
    const sGOT10 = createState(uuidv4(), 'GOT_10', { x: 400, y: 200 }, false); // Saw 10
    const sFOUND = createState(uuidv4(), 'FOUND', { x: 250, y: 300 }, false); // Saw 101

    sFOUND.outputs = [{ signal: 'sequence_found', value: "1'b1" }];

    fsm.states = [sIDLE, sGOT1, sGOT10, sFOUND];

    // Transitions
    fsm.transitions = [
        // IDLE transitions
        createTransition(uuidv4(), sIDLE.id, sGOT1.id, 'data_in'),
        createTransition(uuidv4(), sIDLE.id, sIDLE.id, '!data_in'),

        // GOT_1 transitions
        createTransition(uuidv4(), sGOT1.id, sGOT10.id, '!data_in'),
        createTransition(uuidv4(), sGOT1.id, sGOT1.id, 'data_in'),

        // GOT_10 transitions
        createTransition(uuidv4(), sGOT10.id, sFOUND.id, 'data_in'),
        createTransition(uuidv4(), sGOT10.id, sIDLE.id, '!data_in'),

        // FOUND transitions (overlapping detect)
        createTransition(uuidv4(), sFOUND.id, sGOT10.id, '!data_in'), // 101 -> 0 (implies last 1 was start of new 10... wait no, 1010)
        // If we have 101 and receive 1, we have 1011 -> go to GOT_1? Yes because last 1 is start
        createTransition(uuidv4(), sFOUND.id, sGOT1.id, 'data_in'),
    ];

    return fsm;
};

export const FSM_TEMPLATES: FSMTemplate[] = [
    {
        id: 'traffic-light',
        name: 'Traffic Light Controller',
        description: 'Simple 3-state cycle (Red -> Green -> Yellow) triggered by a timer input.',
        create: createTrafficLightFSM
    },
    {
        id: 'seq-detector-101',
        name: 'Sequence Detector (101)',
        description: 'Moore machine that asserts output when input sequence "101" is detected.',
        create: createSequenceDetectorFSM
    }
];
