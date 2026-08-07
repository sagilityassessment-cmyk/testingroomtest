const SITE = "test";

import { db } from "./firebase.js";
import {
    ref,
    onValue,
    remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const popup = document.getElementById("popup");

const testingLatest =
    document.getElementById("testingLatest");

const testingHistory =
    document.getElementById("testingHistory");

const interviewLatest =
    document.getElementById("interviewLatest");

const interviewHistory =
    document.getElementById("interviewHistory");

const chime = new Audio("./chime.mp3");

let selectedVoice = null;
let queue = [];
let interviewQueue = [];
let processing = false;
let chimePlayed = false;

let testingCalls = [];
let interviewCallsHistory = [];

/* FEMALE VOICE */
function loadFemaleVoice() {

    const voices = speechSynthesis.getVoices();

    selectedVoice =
        voices.find(v => /jenny/i.test(v.name)) ||
        voices.find(v => /aria/i.test(v.name)) ||
        voices.find(v => /zira/i.test(v.name)) ||
        voices.find(v => /samantha/i.test(v.name)) ||
        voices[0];
}

loadFemaleVoice();
speechSynthesis.onvoiceschanged = loadFemaleVoice;

/* DRAW DASHBOARD */
function draw() {

    if (testingCalls.length > 0) {

        const latest = testingCalls[0];

        testingLatest.innerHTML = `
            <div class="latest-title">
                SEAT ${latest.seat}
            </div>

            <div class="latest-id">
                ID ${latest.id}
            </div>
        `;

    } else {

        testingLatest.innerHTML = "";
    }

    testingHistory.innerHTML = "";

    testingCalls
        .slice(1, 9)
        .forEach(item => {

            testingHistory.innerHTML += `
                <div class="history-box">

                    <div class="history-seat">
                        SEAT ${item.seat}
                    </div>

                    <div class="history-id">
                        ${item.id}
                    </div>

                </div>
            `;
        });

    if (interviewCallsHistory.length > 0) {

        const latest =
            interviewCallsHistory[0];

        interviewLatest.innerHTML = `
            <div class="latest-title">
                ${latest.value}
            </div>

            <div class="latest-id">
                ROOM ${latest.room}
            </div>
        `;

    } else {

        interviewLatest.innerHTML = "";
    }

    interviewHistory.innerHTML = "";

    interviewCallsHistory
        .slice(1, 5)
        .forEach(item => {

            interviewHistory.innerHTML += `
                <div class="history-box">

                    <div class="history-seat">
                        ${item.value}
                    </div>

                    <div class="history-id">
                        ROOM ${item.room}
                    </div>

                </div>
            `;
        });
}

draw();

/* TESTING QUEUE */
onValue(
    ref(db, `locations/${SITE}/queue`),
    snapshot => {

        const data =
            snapshot.val() || {};

        queue = Object.entries(data);

    }
);

/* INTERVIEW QUEUE */
onValue(
    ref(db, `locations/${SITE}/interviewQueue`),
    snapshot => {

        const data =
            snapshot.val() || {};

        interviewQueue =
            Object.entries(data);

    }
);

setInterval(async () => {

    if (processing) return;

    if (
        queue.length === 0 &&
        interviewQueue.length === 0
    ) return;

    processing = true;

    let key;
    let item;
    let isInterview = false;

    if (queue.length > 0) {

        [key, item] = queue[0];

    } else {

        [key, item] =
            interviewQueue[0];

        isInterview = true;
    }

    popup.classList.remove("hidden");

    let announceText = "";

    if (isInterview) {

        interviewCallsHistory.unshift({
            room: item.room,
            value: item.value
        });

        interviewCallsHistory =
            interviewCallsHistory.slice(0, 5);

        draw();

        popup.innerHTML = `
            <div class="seat-call">
                ${item.value}
            </div>

            <div class="instruction">
                PLEASE PROCEED TO INTERVIEW ROOM ${item.room}
            </div>
        `;

        if (isNaN(item.value)) {

            announceText =
                `Applicant name ${item.value}. Please proceed to Interview Room ${item.room}.`;

        } else {

            announceText =
                `Applicant ID ${item.value}. Please proceed to Interview Room ${item.room}.`;
        }

    } else {

        testingCalls.unshift({
            seat: item.seat,
            id: item.id
        });

        testingCalls =
            testingCalls.slice(0, 9);

        draw();

        popup.innerHTML = `
            <div class="seat-call">
                SEAT ${item.seat} - ID ${item
