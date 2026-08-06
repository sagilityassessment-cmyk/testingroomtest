const SITE = "test";

import { db } from "./firebase.js";
import {
    ref,
    set,
    get,
    push
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const g = document.getElementById("grid");
const interviewGrid = document.getElementById("interviewGrid");

async function loadSeats() {

    const snapshot = await get(ref(db, `locations/${SITE}/seats`));

    const seats = snapshot               id="seat${i}"
                value="${v}"
                onchange="saveSeat(${i}, this.value)"
            >

            <button
                id="b${i}"
                onclick="callSeat(${i})"
            >
                CALL
            </button>
        </div>
        `;
    }

    renderInterviewRooms();
}

function renderInterviewRooms() {

    if (!interviewGrid) return;

    interviewGrid.innerHTML = "";

    for (let i = 1; i <= 5; i++) {

        interviewGrid.innerHTML += `
        <div class="card">
            <h3>Interview Room ${i}</h3>

            <input
                id="interviewName${i}"
                placeholder="Applicant ID or Name"
            >

            <button
                id="ib${i}"
                onclick="callInterview(${i})"
            >
                CALL INTERVIEW
            </button>
        </div>
        `;
    }
}

window.saveSeat = async function (seat, value) {

    await set(
        ref(db, `locations/${SITE}/seats/${seat}`),
        value || 0
    );
};

window.callSeat = async function (seat) {

    const seatSnapshot = await get(
        ref(db, `locations/${SITE}/seats/${seat}`)
    );

    const id = seatSnapshot.exists()
        ? seatSnapshot.val()
        : 0;

    await push(
        ref(db, `locations/${SITE}/queue`),
        {
            seat,
            id,
            timestamp: Date.now()
        }
    );

    document.getElementById(
        "b" + seat
    ).innerHTML = "CALLED ✓";
};

window.callInterview = async function (room) {

    const input =
        document.getElementById(
            `interviewName${room}`
        );

    const value = input.value.trim();

    if (!value) {
        alert("Enter Applicant ID or Name");
        return;
    }

    await push(
        ref(db, `locations/${SITE}/interviewQueue`),
        {
            room,
            value,
            timestamp: Date.now()
        }
    );

    document.getElementById(
        `ib${room}`
    ).innerHTML = "CALLED ✓";

    input.value = "";
};

window.clearAllSeats = async function () {

    const confirmClear = confirm(
        "Are you sure you want to clear all seat data?"
    );

    if (!confirmClear) return;

    for (let i = 1; i <= 20; i++) {

        await set(
            ref(
                db,
                `locations/${SITE}/seats/${i}`
            ),
            0
        );
    }

    alert("All seats have been reset to 0.");

    loadSeats();
};

loadSeats();
