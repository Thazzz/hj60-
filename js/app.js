
/*
HJ60 dashboard test script
controleert of JS werkt en vult testdata in
*/

console.log("HJ60 dashboard gestart");

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
Trips LADEN
----------------------------- */

async function loadTrips(){

console.log("⏳ trips laden...");

const { data, error } = await supabaseClient
.from("trip")
.select("*");

console.log("RAW data:", data);
console.log("RAW error:", error);

if(error){
console.error("Supabase error:", error);
return;
}

events = data || [];

console.log("Trips geladen:", events);

}

/* -----------------------------
STATUS BALK
----------------------------- */

function updateStatus(){

const statusElement = document.getElementById("status");

const now = new Date();

const activeTrip = events.find(event => {

const start = new Date(event.start_date + "T00:00:00");
const end = new Date(event.end_date + "T23:59:59");

return now >= start && now <= end;

});

if(activeTrip){

statusElement.innerText =
"🚙 Nu onderweg: " + activeTrip.owner;

}

else{

statusElement.innerText =
"🚙 HJ60 staat momenteel stil";

}

}


/* -----------------------------
KLUSSENLIJST
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
KALENDER
----------------------------- */

let currentDate = new Date();
currentDate.setDate(1);

function renderCalendar(){

const grid = document.getElementById("calendarGrid");
const title = document.getElementById("calendarTitle");

grid.innerHTML = "";

const year = currentDate.getFullYear();
const month = currentDate.getMonth();

title.innerText =
currentDate.toLocaleString("nl-NL",{month:"long",year:"numeric"});

const firstDay = new Date(year,month,1).getDay();
const daysInMonth = new Date(year,month+1,0).getDate();

const weekdays = ["ma","di","wo","do","vr","za","zo"];

/* WEEKDAY HEADER */

weekdays.forEach(day=>{
const el = document.createElement("div");
el.className="dayHeader";
el.textContent=day;
grid.appendChild(el);
});

/* START OFFSET */

let start = firstDay===0?6:firstDay-1;
let cellIndex = start;

/* EMPTY CELLS */

for(let i=0;i<start;i++){
const empty = document.createElement("div");
grid.appendChild(empty);
}

/* DAYS */

for(let d=1;d<=daysInMonth;d++){

const cell = document.createElement("div");
cell.className="dayCell";
cell.textContent = d;

const cellDate = new Date(year, month, d);
cell.dataset.date = cellDate.toISOString().split("T")[0];

/* WEEKEND SHADING */

const weekday = cellIndex % 7;
if(weekday === 5 || weekday === 6){
cell.classList.add("weekend");
}

/* HUIDIGE WEEK */

const today = new Date();

const startOfWeek = new Date(today);
startOfWeek.setDate(today.getDate() - today.getDay() + 1);

const endOfWeek = new Date(startOfWeek);
endOfWeek.setDate(startOfWeek.getDate() + 6);

if(cellDate >= startOfWeek && cellDate <= endOfWeek){
cell.classList.add("currentWeek");
}

events.forEach(event => {

if(!event.start_date || !event.end_date) return;

const start = new Date(event.start_date + "T12:00:00");
const end = new Date(event.end_date + "T12:00:00");

// strip tijd (super belangrijk!)
start.setHours(0,0,0,0);
end.setHours(0,0,0,0);

const cellDay = new Date(cellDate);
cellDay.setHours(0,0,0,0);

/* TRIP */

if(cellDay >= start && cellDay <= end){

const label = document.createElement("div");

label.className = "eventTrip";

label.innerText =
"🚙 " + (event.owner || "?") +
" → " + (event.destination || "?");

cell.appendChild(label);

}

});


/* TODAY */

if(
d===today.getDate() &&
month===today.getMonth() &&
year===today.getFullYear()
){
cell.classList.add("today");
}

grid.appendChild(cell);

cellIndex++;

}

}

/* -----------------------------
KALENDER NAVIGATIE
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
BOODSCHAPPENLIJST
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
APP START
----------------------------- */

async function startApp(){

console.log("Dashboard initialiseren");

await loadTrips();

updateStatus();
renderTasks();
renderShopping();
renderCalendar();

document.getElementById("nextMonth").onclick = nextMonth;
document.getElementById("prevMonth").onclick = prevMonth;

}

startApp();
