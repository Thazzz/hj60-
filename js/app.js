/*
HJ60 dashboard
*/

console.log("HJ60 dashboard gestart");

window.onerror = function(msg, url, line){
    console.error("🔥 JS crash:", msg, "line:", line);
};

/* -----------------------------
SUPABASE
----------------------------- */

const supabaseUrl = "https://oevjdxhvtsannskbebdr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ldmpkeGh2dHNhbm5za2JlYmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NzQ2OTMsImV4cCI6MjA4OTM1MDY5M30.5gMo9OBVoUZZ-OZtgIwsgaV0XJjPB-bK90hIKN_0uwA";

const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);


/* -----------------------------
DATA
----------------------------- */

let events = [];

const tasks = [
"Olie verversen",
"Banden controleren",
"Remmen inspecteren"
];

const shopping = [
"Motorolie",
"Oliefilter",
"Remreiniger"
];


/* -----------------------------
TRIPS LADEN (nu ook onderhoud)
----------------------------- */

async function loadTrips(){

console.log("⏳ events laden...");

/* TRIPS */
const { data: trips, error: tripError } = await supabaseClient
.from("trip")
.select("*");

if(tripError){
    console.error("Trip error:", tripError);
}

/* MAINTENANCE */
const { data: maintenance, error: maintenanceError } = await supabaseClient
.from("maintenance")
.select("*");

if(maintenanceError){
    console.error("Maintenance error:", maintenanceError);
}

/* NORMALIZE DATA */
const tripEvents = (trips || []).map(t => ({
    ...t,
    type: "trip"
}));

const maintenanceEvents = (maintenance || []).map(m => ({
    ...m,
    type: "onderhoud",
    start_date: m.date,        // 👈 belangrijk
    end_date: m.date           // 👈 belangrijk
}));

/* COMBINE */
events = [...tripEvents, ...maintenanceEvents];

}

/* -----------------------------
STATUS
----------------------------- */

function updateStatus(){

const statusElement = document.getElementById("status");
const now = new Date();

const activeTrip = events.find(event => {

if(event.type !== "trip") return false;

const start = new Date(event.start_date + "T00:00:00");
const end = new Date(event.end_date + "T23:59:59");

return now >= start && now <= end;

});

if(activeTrip){
statusElement.innerText = "🚙 Nu onderweg: " + activeTrip.owner;
}
else{
statusElement.innerText = "🚙 HJ60 staat momenteel stil";
}

}


/* -----------------------------
TASKS
----------------------------- */

function renderTasks(){

const list = document.getElementById("taskList");
list.innerHTML = "";

tasks.forEach(task => {
const li = document.createElement("li");
li.textContent = task;
list.appendChild(li);
});

}


/* -----------------------------
SHOPPING
----------------------------- */

function renderShopping(){

const list = document.getElementById("shoppingList");
list.innerHTML = "";

shopping.forEach(item => {
const li = document.createElement("li");
li.textContent = item;
list.appendChild(li);
});

}


/* -----------------------------
GEAR
----------------------------- */

const gear = [
{ name: "Tent", status: "ok" },
{ name: "Jerrycan", status: "slijtage" },
{ name: "Accu", status: "vervangen" }
];

function renderGear(){

const container = document.getElementById("gearList");
if(!container) return;

container.innerHTML = "";

gear.forEach(item => {

const div = document.createElement("div");
div.className = "gearItem";
div.innerText = item.name + " - " + item.status;

container.appendChild(div);

});

}

function renderMaintenance(){

const container = document.getElementById("maintenanceList");
if(!container) return;

container.innerHTML = "";

events
.filter(e => e.type === "onderhoud")
.forEach(e => {

    const row = document.createElement("div");
    row.className = "maintenanceRow";

    const name = document.createElement("span");
    name.innerText = e.location || "Onbekend";

    const date = document.createElement("span");
    date.innerText = e.start_date || "-";

    row.appendChild(name);
    row.appendChild(date);

    container.appendChild(row);

});

}

/* -----------------------------
KALENDER
----------------------------- */

let currentDate = new Date();
currentDate.setDate(1);

function renderCalendar(){

const grid = document.getElementById("calendarGrid");
const title = document.getElementById("calendarTitle");

if(!grid) return;

grid.innerHTML = "";

const year = currentDate.getFullYear();
const month = currentDate.getMonth();

title.innerText =
currentDate.toLocaleString("nl-NL",{month:"long",year:"numeric"});

const firstDay = new Date(year,month,1).getDay();
const daysInMonth = new Date(year,month+1,0).getDate();

const weekdays = ["ma","di","wo","do","vr","za","zo"];

/* HEADER */

weekdays.forEach(day=>{
const el = document.createElement("div");
el.className="dayHeader";
el.textContent=day;
grid.appendChild(el);
});

/* OFFSET */

let startOffset = firstDay===0?6:firstDay-1;
let cellIndex = startOffset + 7;

/* EMPTY CELLS */

for(let i=0;i<startOffset;i++){
const empty = document.createElement("div");
grid.appendChild(empty);
}

/* DAYS */

for(let d=1;d<=daysInMonth;d++){

const cell = document.createElement("div");
cell.className="dayCell";
cell.textContent = d;

const cellDate = new Date(year, month, d);

/* WEEKEND */

const weekday = cellIndex % 7;
if(weekday === 5 || weekday === 6){
cell.classList.add("weekend");
}

/* TODAY */

const today = new Date();
if(
d===today.getDate() &&
month===today.getMonth() &&
year===today.getFullYear()
){
cell.classList.add("today");
}

grid.appendChild(cell);

/* EVENTS */

events.forEach(event => {

const start = new Date(event.start_date + "T00:00:00");
const end = new Date(event.end_date + "T00:00:00");

start.setHours(0,0,0,0);
end.setHours(0,0,0,0);

const current = new Date(cellDate);
current.setHours(0,0,0,0);

/* =============================
ONDERHOUD (1 dag)
============================= */

if(event.type === "onderhoud"){

    if(current.getTime() === start.getTime()){

        const label = document.createElement("div");
        label.className = "eventOnderhoud";
        label.innerText = "🔧 " + (event.location || "");

        cell.appendChild(label);
    }

    return;
}




/* =============================
TRIP (meerdere dagen)
============================= */

if(current >= start && current <= end){

    const weekday = cellIndex % 7;

    const isSegmentStart =
    current.getTime() === start.getTime() ||
    weekday === 0 ||
    d === 1;

    if(!isSegmentStart) return;

    const segmentStart = new Date(Math.max(start, current));

    const endOfWeek = new Date(current);
    endOfWeek.setDate(current.getDate() + (6 - weekday));

    const endOfMonth = new Date(year, month + 1, 0);

    const segmentEnd = new Date(
        Math.min(end, endOfWeek, endOfMonth)
    );

    const span =
    Math.round((segmentEnd - segmentStart) / (1000*60*60*24)) + 1;

    const label = document.createElement("div");
    label.className = "eventTrip";

    label.innerText =
    "🚙 " + (event.owner || "?") +
    " → " + (event.destination || "?");

    const rect = cell.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();

    const cellWidth = rect.width;

    label.style.position = "absolute";
    label.style.left = (rect.left - gridRect.left) + "px";
    label.style.top = (rect.top - gridRect.top + 22) + "px";
    label.style.width = (cellWidth * span - 8) + "px";

    grid.appendChild(label);
}

});

cellIndex++;

}

}


/* -----------------------------
NAVIGATIE
----------------------------- */

function nextMonth(){
currentDate.setMonth(currentDate.getMonth()+1);
renderCalendar();
}

function prevMonth(){
currentDate.setMonth(currentDate.getMonth()-1);
renderCalendar();
}


/* -----------------------------
START
----------------------------- */

async function startApp(){

console.log("Dashboard initialiseren");

await loadTrips();

updateStatus();
renderTasks();
renderMaintenance();
renderShopping();
renderCalendar();
renderGear();

document.getElementById("nextMonth").onclick = nextMonth;
document.getElementById("prevMonth").onclick = prevMonth;

}

startApp();