/*
HJ60 dashboard
*/

console.log("HJ60 dashboard gestart");

window.onerror = function(msg, url, line){
    console.error("\u{1F525} JS crash:", msg, "line:", line);
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

let tasks = [];

const TASK_PHOTO_BUCKET = "task-photos";
let activeTask = null;

/* -----------------------------
TRIPS LADEN (nu ook onderhoud)
----------------------------- */

async function loadTrips(){

console.log("\u23F3 events laden...");

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
    id: m.id,
    type: "onderhoud",
    start_date: m.last_done_date || null,
    end_date: m.last_done_date || null,
    location: m.name
}));

/* COMBINE */
events = [...tripEvents, ...maintenanceEvents];

}

/* -----------------------------
STATUS
----------------------------- */

function updateStatus(){

const statusElement = document.getElementById("status");
if(!statusElement) return;

const now = new Date();

const activeTrip = events.find(event => {

if(event.type !== "trip") return false;

const start = new Date(event.start_date + "T00:00:00");
const end = new Date(event.end_date + "T23:59:59");

return now >= start && now <= end;

});

if(activeTrip){

    statusElement.className = "headerStatus status-active";

    const text = `\u{1F699} ${activeTrip.owner} \u2192 ${activeTrip.destination || ""}`;

    statusElement.textContent = "";
    const textSpan = document.createElement("span");
    textSpan.textContent = text;
    statusElement.appendChild(textSpan);

    // ðŸ”¥ snelheid aanpassen
    const speed = Math.max(15, text.length * 1.2);

    textSpan.style.animationDuration = speed + "s";

} else {
    statusElement.className = "headerStatus status-idle";
    statusElement.innerText = "\u{1F6E0}\uFE0F werkplaats";
}
}
/* -----------------------------
LOAD TASKS
----------------------------- */

async function loadTasks(){

    const { data, error } = await supabaseClient
        .from("tasks")
        .select("*")
        .neq("status", "done")
        .order("priority", { ascending: true });

    if(error){
        console.error("\u274C tasks load error", error);
        return;
    }

    tasks = data;

tasks.sort((a, b) => {

    const statusOrder = {
        "doing": 0,
        "todo": 1
    };

    const statusDiff =
        (statusOrder[a.status] ?? 99) -
        (statusOrder[b.status] ?? 99);

    if(statusDiff !== 0) return statusDiff;

    return a.priority - b.priority;

});

}
async function loadGear(){

    const { data, error } = await supabaseClient
        .from("gear")
        .select("*")
        .order("name");

    if(error){
        console.error("gear load error", error);
        return;
    }

    gear = data;

    renderGear();
}

/* -----------------------------
TASKS
----------------------------- */

function renderTasks(){

    const list = document.getElementById("taskList");
    if(!list) return;
    list.innerHTML = "";

    if(tasks.length === 0){
        list.innerHTML = "<li>Geen klussen</li>";
        return;
    }

    let lastStatus = null;

   const maxTasks = 6;
   const visibleTasks = tasks.slice(0, maxTasks);

   visibleTasks.forEach(task => {

        // ðŸ”¥ divider toevoegen bij status wissel
        if(task.status !== lastStatus){

            const divider = document.createElement("li");
            divider.className = "taskGroupLabel";
            divider.innerText =
                task.status === "doing" ? "\u{1F527} Bezig" : "\u{1F4CB} Te doen";

            divider.style.opacity = "0.6";
            divider.style.marginTop = "10px";

            list.appendChild(divider);

            lastStatus = task.status;
        }

        const li = document.createElement("li");
        li.className = "taskItem";
        li.append(`${getPriorityIcon(task.priority)} `);

        const titleSpan = document.createElement("span");
        titleSpan.className = `taskTitle ${task.status}`;
        titleSpan.textContent = task.title || "";
        li.appendChild(titleSpan);

        const meta = document.createElement("small");
        meta.className = "taskOwner";
        meta.textContent = task.owner || "-";
        li.appendChild(meta);

    li.onclick = () => openTaskModal(task);

        list.appendChild(li);

    });

}
function getPriorityIcon(p){
    if(p === 1) return "\u{1F534}";
    if(p === 2) return "\u{1F7E0}";
    return "\u{1F7E2}";
}

function getPriorityLabel(priority){
    if(priority === 1) return "Hoog";
    if(priority === 2) return "Midden";
    return "Laag";
}

function getStatusLabel(status){
    if(status === "doing") return "Bezig";
    if(status === "done") return "Done";
    return "Te doen";
}

function getTaskPhotoUrl(path){
    if(!path) return "";

    const { data } = supabaseClient
        .storage
        .from(TASK_PHOTO_BUCKET)
        .getPublicUrl(path);

    return data?.publicUrl || "";
}

function openTaskModal(task){

    activeTask = task;

    const modal = document.getElementById("taskModal");
    const title = document.getElementById("taskModalTitle");
    const owner = document.getElementById("taskModalOwner");
    const status = document.getElementById("taskModalStatus");
    const priority = document.getElementById("taskModalPriority");
    const description = document.getElementById("taskModalDescription");
    const shopping = document.getElementById("taskModalShopping");
    const photoWrap = document.getElementById("taskModalPhotoWrap");
    const photo = document.getElementById("taskModalPhoto");

    if(!modal || !title || !owner || !status || !priority || !description || !shopping || !photoWrap || !photo){
        return;
    }

    title.textContent = task.title || "Klus";
    owner.textContent = task.owner || "-";
    status.textContent = getStatusLabel(task.status);
    priority.textContent = `${getPriorityIcon(task.priority)} ${getPriorityLabel(task.priority)}`;
    description.textContent = task.description?.trim() || "Geen beschrijving";

    shopping.innerHTML = "";

    const shoppingItems = (task.shopping || "")
        .split(/\n|,/)
        .map(item => item.trim())
        .filter(Boolean);

    if(shoppingItems.length === 0){
        const li = document.createElement("li");
        li.textContent = "Geen boodschappen";
        shopping.appendChild(li);
    } else {
        shoppingItems.forEach(item => {
            const li = document.createElement("li");
            li.textContent = item;
            shopping.appendChild(li);
        });
    }

    if(task.photo_path){
        photo.src = getTaskPhotoUrl(task.photo_path);
        photoWrap.style.display = "flex";
    } else {
        photo.removeAttribute("src");
        photoWrap.style.display = "none";
    }

    document.querySelectorAll(".taskStatusBtn").forEach(button => {
        button.classList.toggle("active", button.dataset.status === task.status);
    });

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
}

function closeTaskModal(){
    const modal = document.getElementById("taskModal");
    const photo = document.getElementById("taskModalPhoto");

    activeTask = null;

    if(!modal) return;

    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");

    if(photo){
        photo.removeAttribute("src");
    }
}

async function updateTaskStatus(id, newStatus){
    const { error } = await supabaseClient
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", id);

    if(error){
        console.error("\u274C update error", error);
        alert("Status wijzigen mislukt");
        return false;
    }

    console.log("\u2705 status updated:", newStatus);

    await loadTasks();
    renderTasks();
    renderShopping();
    return true;
}

async function handleTaskStatusChange(newStatus){

    if(!activeTask) return;

    const updated = await updateTaskStatus(activeTask.id, newStatus);
    if(!updated) return;

    closeTaskModal();
}

function setupTaskModal(){
    const closeButton = document.getElementById("taskModalClose");
    const backdrop = document.getElementById("taskModalBackdrop");
    const statusButtons = document.querySelectorAll(".taskStatusBtn");

    if(closeButton){
        closeButton.onclick = closeTaskModal;
    }

    if(backdrop){
        backdrop.onclick = closeTaskModal;
    }

    statusButtons.forEach(button => {
        button.onclick = () => handleTaskStatusChange(button.dataset.status);
    });

    document.addEventListener("keydown", event => {
        if(event.key === "Escape"){
            closeTaskModal();
        }
    });
}

/* -----------------------------
SHOPPING
----------------------------- */
function renderShopping(){


    const list = document.getElementById("shoppingList");
    list.innerHTML = "";

    if(!tasks || tasks.length === 0){
        list.innerHTML = "<li>Geen klussen</li>";
        return;
    }

    const allItems = tasks
        .filter(t => t.shopping)
        .flatMap(task =>
            task.shopping
                .split(/\n|,/)
                .map((rawItem, index) => ({
                    taskId: task.id,
                    itemIndex: index,
                    text: rawItem.trim()
                }))
        )
        .filter(item => item.text !== "");

    if(allItems.length === 0){
        list.innerHTML = "<li>Geen boodschappen</li>";
        return;
    }

    allItems.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item.text;
        li.style.cursor = "pointer";
        li.title = "Klik om uit de lijst te halen";
        li.onclick = () => confirmShoppingRemoval(item);
        list.appendChild(li);
    });


console.log("\u{1F6D2} allItems:", allItems);

}

function confirmShoppingRemoval(item){

    const confirmed = confirm(`Boodschap uit de lijst halen?\n\n${item.text}`);

    if(!confirmed) return;

    removeShoppingItem(item);
}

async function removeShoppingItem(item){

    const task = tasks.find(task => task.id === item.taskId);

    if(!task || !task.shopping){
        console.error("Boodschap niet gevonden in takenlijst:", item);
        return;
    }

    const shoppingItems = task.shopping.split(/\n|,/);

    if(item.itemIndex < 0 || item.itemIndex >= shoppingItems.length){
        console.error("Ongeldige boodschap-index:", item);
        return;
    }

    shoppingItems.splice(item.itemIndex, 1);

    const updatedShopping = shoppingItems
        .map(entry => entry.trim())
        .filter(entry => entry !== "")
        .join("\n") || null;

    const { error } = await supabaseClient
        .from("tasks")
        .update({ shopping: updatedShopping })
        .eq("id", item.taskId);

    if(error){
        console.error("❌ boodschap verwijderen mislukt", error);
        alert("Boodschap verwijderen mislukt");
        return;
    }

    await loadTasks();
    renderShopping();
}

/* -----------------------------
GEAR
----------------------------- */

let gear = [];

function renderGear(){

const container = document.getElementById("gearList");
if(!container) return;

container.innerHTML = "";

// ðŸ”¥ alleen relevante gear tonen
const filtered = gear.filter(g =>
    g.status === "slijtage" || g.status === "vervangen"
);

if(filtered.length === 0){
    container.innerHTML = "<div class='gearItem'>Alles in orde \u{1F44D}</div>";
    return;
}

filtered.forEach(item => {

    const div = document.createElement("div");
    div.className = "gearItem";

     if(item.status === "vervangen"){
        div.style.fontWeight = "bold";
        div.style.color = "#ff6b6b";
    }

    div.innerText = item.name;

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

const date = document.createElement("input");
date.type = "date";
date.value = e.start_date || "";

date.addEventListener("change", async () => {
    await updateMaintenanceDate(e.id, date.value);

    await loadTrips();
    renderMaintenance();
    renderCalendar();
});

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

if(!grid || !title) return;

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

if(!event.start_date || !event.end_date){
    return;
}

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
        label.innerText = "\u{1F527} " + (event.location || "");

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

const text =
    (event.owner || "") + " " +
    (event.destination || "");

if(text.toLowerCase().includes("onderhoud")){
    label.className = "eventTripOnderhoud";
} else {
    label.className = "eventTrip";
}

    label.innerText =
    "\u{1F699} " + (event.owner || "?") +
    " \u2192 " + (event.destination || "?");

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
await loadTasks();
await loadGear();

updateStatus();
renderTasks();
renderMaintenance();
renderShopping();
renderCalendar();

const nextMonthButton = document.getElementById("nextMonth");
const prevMonthButton = document.getElementById("prevMonth");

if(nextMonthButton) nextMonthButton.onclick = nextMonth;
if(prevMonthButton) prevMonthButton.onclick = prevMonth;
setupTaskModal();

}

async function updateMaintenanceDate(id, newDate){

const { error } = await supabaseClient
.from("maintenance")
.update({
    last_done_date: newDate
})
.eq("id", id);

if(error){
    console.error("Update fout:", error);
} else {
    console.log("\u2705 onderhoud geupdate");
}
}



startApp();
