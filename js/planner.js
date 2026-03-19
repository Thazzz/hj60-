/*
HJ60 Planner App
*/

console.log("Planner gestart");

/* =============================
SUPABASE
============================= */

const supabaseUrl = "https://oevjdxhvtsannskbebdr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ldmpkeGh2dHNhbm5za2JlYmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NzQ2OTMsImV4cCI6MjA4OTM1MDY5M30.5gMo9OBVoUZZ-OZtgIwsgaV0XJjPB-bK90hIKN_0uwA";

const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);


/* =============================
STATE
============================= */

let trips = [];
let editingId = null;


/* =============================
INIT USER (LOCAL STORAGE)
============================= */

function initUser(){

const savedUser = localStorage.getItem("user_id");

if(savedUser){
    document.getElementById("email").value = savedUser;
}

}


/* =============================
LOAD TRIPS (ALLEEN EIGEN)
============================= */

async function loadTrips(){

console.log("⏳ events laden...");

const user_id = localStorage.getItem("user_id");

if(!user_id){
    trips = [];
    renderTripList();
    return;
}

const { data, error } = await supabaseClient
.from("trip")
.select("*")
.order("start_date", { ascending: true });

if(error){
console.error("Fout bij laden:", error);
return;
}

trips = data || [];

renderTripList();

}


/* =============================
RENDER LIST
============================= */

function renderTripList(){

const container = document.getElementById("tripList");
container.innerHTML = "";

if(trips.length === 0){
container.innerText = "Nog geen events";
return;
}

trips.forEach(trip => {

const div = document.createElement("div");
div.className = "tripItem";

/* CLICKABLE */
div.onclick = () => loadIntoForm(trip);

/* TRIP */
if(trip.type === "trip"){
    div.innerText =
    trip.start_date +
    " → " +
    trip.end_date +
    " | " +
    (trip.owner || "?") +
    (trip.destination ? " → " + trip.destination : "");
}

/* ONDERHOUD */
if(trip.type === "onderhoud"){
    div.innerText =
    "🔧 " +
    trip.start_date +
    " | " +
    (trip.location || "onbekend");
}

container.appendChild(div);

});

}


/* =============================
LOAD INTO FORM (EDIT MODE)
============================= */

function loadIntoForm(trip){

const user_id = localStorage.getItem("user_id");

/* SECURITY CHECK */
if(trip.user_id !== user_id){
    alert("Dit event is niet van jou");
    return;
}

editingId = trip.id;

document.getElementById("eventType").value = trip.type;
document.getElementById("eventType").dispatchEvent(new Event("change"));

if(trip.type === "trip"){
    document.getElementById("owner").value = trip.owner || "";
    document.getElementById("destination").value = trip.destination || "";
    document.getElementById("start").value = trip.start_date;
    document.getElementById("end").value = trip.end_date;
}

if(trip.type === "onderhoud"){
    document.getElementById("onderhoudDate").value = trip.start_date;
    document.getElementById("location").value = trip.location || "";
}

document.getElementById("feedback").innerText = "✏️ bewerken";

}


/* =============================
SAVE EVENT
============================= */

async function saveEvent(){

const feedback = document.getElementById("feedback");
const type = document.getElementById("eventType").value;
const user_id = document.getElementById("email").value.trim();
localStorage.setItem("user_id", user_id);

/* VALIDATE USER */

if(!user_id){
    feedback.innerText = "⚠️ vul je email in";
    return;
}

/* SAVE USER */

localStorage.setItem("user_id", user_id);

/* PAYLOAD BASIS */

let payload = { 
    type,
    user_id
};


/* =============================
TRIP
============================= */

if(type === "trip"){

    const owner = document.getElementById("owner").value.trim();
    const destination = document.getElementById("destination").value.trim();
    const start = document.getElementById("start").value;
    let end = document.getElementById("end").value;

    if(!owner || !start){
        feedback.innerText = "⚠️ vul minimaal naam en startdatum in";
        return;
    }

    if(!end){
        end = start;
    }

    if(end < start){
        feedback.innerText = "⚠️ einddatum kan niet vóór startdatum";
        return;
    }

    const conflict = trips.find(t =>
        t.type === "trip" &&
        t.id !== editingId &&
        start <= t.end_date &&
        end >= t.start_date
    );

    if(conflict){
        feedback.innerText =
        "⚠️ conflict met " +
        (conflict.owner || "?") +
        " (" + conflict.start_date + ")";
        return;
    }

    payload.owner = owner;
    payload.destination = destination;
    payload.start_date = start;
    payload.end_date = end;
    payload.status = "aangevraagd";
}


/* =============================
ONDERHOUD
============================= */

if(type === "onderhoud"){

    const date = document.getElementById("onderhoudDate").value;
    const location = document.getElementById("location").value.trim();

    if(!date || !location){
        feedback.innerText = "⚠️ vul datum en locatie in";
        return;
    }

    payload.start_date = date;
    payload.end_date = date;
    payload.location = location;
    payload.status = "gepland";
}


/* =============================
INSERT OF UPDATE
============================= */

let query;

if(editingId){

    query = supabaseClient
    .from("trip")
    .update(payload)
    .eq("id", editingId)
    .eq("user_id", user_id);

} else {

    query = supabaseClient
    .from("trip")
    .insert([payload]);

}

const { error } = await query;

if(error){
console.error("Opslaan fout:", error);
feedback.innerText = "❌ opslaan mislukt";
return;
}


/* =============================
SUCCESS
============================= */

feedback.innerText = "✅ opgeslagen";
editingId = null;

/* RESET FORM */

document.getElementById("owner").value = "";
document.getElementById("destination").value = "";
document.getElementById("start").value = "";
document.getElementById("end").value = "";
document.getElementById("onderhoudDate").value = "";
document.getElementById("location").value = "";

await loadTrips();

}


/* =============================
TYPE SWITCH
============================= */

function setupTypeSwitch(){

const eventType = document.getElementById("eventType");
const tripFields = document.getElementById("tripFields");
const onderhoudFields = document.getElementById("onderhoudFields");
const title = document.querySelector(".formCard h2");

eventType.addEventListener("change", () => {

    const type = eventType.value;

    if(type === "trip"){
        tripFields.style.display = "block";
        onderhoudFields.style.display = "none";
        title.innerText = "Nieuwe trip";
    }

    if(type === "onderhoud"){
        tripFields.style.display = "none";
        onderhoudFields.style.display = "block";
        title.innerText = "Nieuw onderhoud";
    }

});

}


/* =============================
INIT
============================= */

window.addEventListener("DOMContentLoaded", () => {

document.getElementById("saveBtn").onclick = saveEvent;

setupTypeSwitch();
initUser();     // 🔥 FIXED
startApp();

});


async function startApp(){
await loadTrips();
}