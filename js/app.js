/*
HJ60 dashboard test script
controleert of JS werkt en vult testdata in
*/

console.log("HJ60 dashboard gestart");

/* -----------------------------
TEST DATA
----------------------------- */

const events = [

{
    title: "Tom naar Noorwegen",
    start: "2026-06-10",
    end: "2026-06-20",
    type: "trip",
    owner: "Tom"
},

{
    title: "Klusdag",
    start: "2026-04-12",
    type: "klus"
}

];

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
STATUS BALK
----------------------------- */

function updateStatus(){

    const statusElement = document.getElementById("status");

    const now = new Date();

    const activeTrip = events.find(event => {

        if(!event.end) return false;

        const start = new Date(event.start);
        const end = new Date(event.end);

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

weekdays.forEach(day=>{
const el = document.createElement("div");
el.className="dayHeader";
el.textContent=day;
grid.appendChild(el);
});

let start = firstDay===0?6:firstDay-1;

for(let i=0;i<start;i++){

const empty = document.createElement("div");
grid.appendChild(empty);

}

for(let d=1;d<=daysInMonth;d++){

const cell = document.createElement("div");

cell.className="dayCell";

cell.textContent=d;

const today = new Date();

if(
d===today.getDate() &&
month===today.getMonth() &&
year===today.getFullYear()
){

cell.classList.add("today");

}

grid.appendChild(cell);

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

function startApp(){

    console.log("Dashboard initialiseren");

    updateStatus();

    renderTasks();

    renderShopping();

    renderCalendar();

    document.getElementById("nextMonth").onclick = nextMonth;
    document.getElementById("prevMonth").onclick = prevMonth;

}

startApp();
