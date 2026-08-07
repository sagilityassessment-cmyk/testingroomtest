const SITE = "test";

import { db } from "./firebase.js";
import {
    ref,
    onValue,
    remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const board = document.getElementById("board");
const popup = document.getElementById("popup");

const chime = new Audio("./chime.mp3");

let selectedVoice = null;
let queue = [];
let interviewQueue = [];
let processing = false;
let chimePlayed = false;

/* FEMALE VOICE */
function loadFemaleVoice() {

    const voices = speechSynthesis.getVoices();

    selectedVoice =
        voices.find(v => /jenny/i.test(v.name)) ||
        voices.find(v => /aria/i.test(v.name)) ||
        voices.find(v => /zira/i.test(v.name)) ||
        voices.find(v => /samantha/i.test(v.name)) ||
        voices[0];

    console.log("Using voice:", selectedVoice?.name);
}

loadFemaleVoice();
speechSynthesis.onvoiceschanged = loadFemaleVoice;

/* DISPLAY BOARD */
function draw(seats = []) {

    let latestSeat = "-";
    let latestId = "-";

    for (let i = 20; i >= 1; i--) {

        if (seats[i] && seats[i] != 0) {

            latestSeat = i;
            latestId = seats[i];
            break;
        }
    }

    let html = `

    <div style="
        width:95%;
        margin:20px auto;
        background:#21105e;
        color:white;
        font-size:70px;
        font-weight:900;
        text-align:center;
        border-radius:10px;
        padding:10px;
    ">
        TESTING ROOM
    </div>

    <div style="
        width:850px;
        height:250px;
        margin:25px auto;
        background:white;
        border:5px solid #21105e;
        border-radius:15px;

        display:flex;
        flex-direction:column;
        justify-content:center;
        align-items:center;
    ">
        <div style="
            font-size:90px;
            font-weight:900;
            color:#21105e;
        ">
            SEAT ${latestSeat}
        </div>

        <div style="
            font-size:65px;
            color:#21105e;
        ">
            ${latestId}
        </div>
    </div>

    <div style="
        width:95%;
        margin:auto;

        display:grid;
        grid-template-columns:repeat(4,1fr);
        gap:20px;
    ">
    `;

    for (let i = 1; i <= 20; i++) {

        html += `
        <div style="
            background:white;
            border:3px solid #21105e;
            border-radius:12px;
            padding:20px;
            text-align:center;
        ">
            <div style="
                font-size:34px;
                font-weight:900;
                color:#21105e;
            ">
                SEAT ${i}
            </div>

            <div style="
                font-size:28px;
                margin-top:10px;
                color:#21105e;
            ">
                ${seats[i] || 0}
            </div>
        </div>
        `;
    }

    html += `
    </div>

    <div style="
        width:95%;
        margin:40px auto 20px auto;
        background:#21105e;
        color:white;
        font-size:70px;
        font-weight:900;
        text-align:center;
        border-radius:10px;
        padding:10px;
    ">
        INTERVIEW ROOM
    </div>

    <div style="
        width:850px;
        height:250px;
        margin:25px auto;
        background:white;
        border:5px solid #21105e;
        border-radius:15px;

        display:flex;
        justify-content:center;
        align-items:center;

        font-size:70px;
        font-weight:900;
        color:#21105e;
    ">
        WAITING FOR INTERVIEW CALL
    </div>
    `;

    board.innerHTML = html;
}

/* SEATS */
onValue(
    ref(db, `locations/${SITE}/seats`),
    snapshot => {

        const seats =
            snapshot.val() || [];

        draw(seats);

    }
);

/* TESTING QUEUE */
onValue(
    ref(db, `locations/${SITE}/queue`),
    snapshot => {

        const data =
            snapshot.val() || {};

        queue =
            Object.entries(data);

        if (
            queue.length === 0 &&
            interviewQueue.length === 0
        ) {
            chimePlayed = false;
        }

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

        if (
            queue.length === 0 &&
            interviewQueue.length === 0
        ) {
            chimePlayed = false;
        }

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

        [key, item] = interviewQueue[0];
        isInterview = true;
    }

    popup.classList.remove("hidden");

    let announceText = "";

    if (isInterview) {

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

        popup.innerHTML = `
            <div class="seat-call">
                SEAT ${item.seat} - ID ${item.id}
            </div>

            <div class="instruction">
                PLEASE PROCEED TO TESTING ROOM
            </div>
        `;

        if (isNaN(item.id)) {

            announceText =
                `Seat number ${item.seat}. Applicant ${item.id}. Please proceed to Testing Room.`;

        } else {

            announceText =
                `Seat number ${item.seat}. ID number ${item.id}. Please proceed to Testing Room.`;
        }
    }

    const speak = () => {

        speechSynthesis.cancel();

        const speech =
            new SpeechSynthesisUtterance(
                announceText
            );

        speech.voice = selectedVoice;
        speech.rate = 0.9;
        speech.pitch = 1;
        speech.volume = 1;

        speechSynthesis.speak(speech);
    };

    try {

        if (!chimePlayed) {

            chimePlayed = true;

            chime.pause();
            chime.currentTime = 0;

            await chime.play();

            setTimeout(() => {
                speak();
            }, 2000);

        } else {

            speak();
        }

    } catch (err) {

        console.log("Chime failed:", err);

        speak();
    }

    setTimeout(async () => {

        popup.classList.add("hidden");

        try {

            await remove(
                ref(
                    db,
                    isInterview
                        ? `locations/${SITE}/interviewQueue/${key}`
                        : `locations/${SITE}/queue/${key}`
                )
            );

        } catch (err) {

            console.log(err);
        }

        processing = false;

    }, 10000);

}, 2000);
