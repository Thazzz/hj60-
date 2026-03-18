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

/* =============================
LOAD TRIPS
============================= */

async function loadTrips(){

console.log("⏳ trips laden...");

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
container.innerText = "Nog geen ritten";
return;
}

trips.forEach(trip => {

const div = document.createElement("div");
div.className = "tripItem";

div.innerText =
trip.start_date +
" → " +
trip.end_date +
" | " +
(trip.owner || "?") +
(trip.destination ? " → " + trip.destination : "");

container.appendChild(div);

});

}

/* =============================
SAVE TRIP
============================= */

document.getElementById("saveBtn").onclick = saveTrip;

async function saveTrip(){

const owner = document.getElementById("owner").value.trim();
const destination = document.getElementById("destination").value.trim();
const start = document.getElementById("start").value;
let end = document.getElementById("end").value;

const feedback = document.getElementById("feedback");

/* VALIDATIE */

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

/* CONFLICT CHECK */

const conflict = trips.find(t =>
start <= t.end_date && end >= t.start_date
);

if(conflict){
feedback.innerText =
"⚠️ conflict met " +
(conflict.owner || "?") +
" (" + conflict.start_date + ")";
return;
}

/* OPSLAAN */

const { error } = await supabaseClient
.from("trip")
.insert([{
owner,
destination,
start_date: start,
end_date: end
}]);

if(error){
console.error("Opslaan fout:", error);
feedback.innerText = "❌ opslaan mislukt";
return;
}

feedback.innerText = "✅ opgeslagen";

/* RESET FORM */

document.getElementById("owner").value = "";
document.getElementById("destination").value = "";
document.getElementById("start").value = "";
document.getElementById("end").value = "";

/* REFRESH */

await loadTrips();

}

/* =============================
INIT
============================= */

async function startApp(){

await loadTrips();

}

startApp();
