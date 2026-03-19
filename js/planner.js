/*
HJ60 Planner App - CLEAN VERSION
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
let editingUserId = null;

/* =============================
HELPERS
============================= */

function enableForm(enabled){
    const fields = document.querySelectorAll("input, select");

    fields.forEach(f => {
        f.disabled = !enabled;
    });
}

function getUserId(){
    return localStorage.getItem("user_id");
}

function setUserId(id){
    localStorage.setItem("user_id", id);
}

function resetForm(){
    editingId = null;
    editingUserId = null;

    document.getElementById("owner").value = "";
    document.getElementById("destination").value = "";
    document.getElementById("start").value = "";
    document.getElementById("end").value = "";
    document.getElementById("onderhoudDate").value = "";
    document.getElementById("location").value = "";

const deleteBtn = document.getElementById("deleteBtn");
if(deleteBtn) deleteBtn.style.display = "none";

    enableForm(true); // 🔥 deze niet vergeten
}

/* =============================
INIT USER
============================= */

function initUser(){
    const saved = getUserId();
    if(saved){
        document.getElementById("email").value = saved;
    }
}

/* =============================
LOAD EVENTS
============================= */

async function loadTrips(){

  

    const { data, error } = await supabaseClient
        .from("trip")
        .select("*")
        .order("start_date", { ascending: true });

    if(error){
        console.error(error);
        return;
    }

    trips = data || [];
    renderTripList();
}

/* =============================
RENDER LIST
============================= */

function renderTripList(){

    const el = document.getElementById("tripList");
    el.innerHTML = "";

    if(trips.length === 0){
        el.innerText = "Nog geen events";
        return;
    }

    trips.forEach(t => {

        const div = document.createElement("div");
        div.className = "tripItem";

        div.onclick = () => loadIntoForm(t);

        if(t.type === "trip"){
            div.innerText =
                `${t.start_date} → ${t.end_date} | ${t.owner || "?"}` +
                (t.destination ? ` → ${t.destination}` : "");
        }

        if(t.type === "onderhoud"){
            div.innerText =
                `🔧 ${t.start_date} | ${t.destination || "onbekend"}`;
        }

        el.appendChild(div);
    });
}

/* =============================
LOAD INTO FORM
============================= */

function loadIntoForm(t){

    console.log("LOAD INTO FORM", {
        id: t.id,
        user: t.user_id
    });

    editingId = t.id;
    editingUserId = t.user_id;

    const typeEl = document.getElementById("eventType");
    typeEl.value = t.type;
    typeEl.dispatchEvent(new Event("change"));

    if(t.type === "trip"){
        document.getElementById("owner").value = t.owner || "";
        document.getElementById("destination").value = t.destination || "";
        document.getElementById("start").value = t.start_date;
        document.getElementById("end").value = t.end_date;
    }

    if(t.type === "onderhoud"){
        document.getElementById("onderhoudDate").value = t.start_date;
        document.getElementById("location").value = t.destination || "";
    }

    const deleteBtn = document.getElementById("deleteBtn");
    const feedback = document.getElementById("feedback");

    // 🔥 NIEUW
    const isOwner = t.user_id === getUserId();

    if(deleteBtn){
        console.log("DELETE BTN FOUND", { isOwner });

        if(isOwner){
            deleteBtn.style.display = "block";
            deleteBtn.style.visibility = "visible";
            deleteBtn.style.opacity = "1";
            deleteBtn.onclick = deleteEvent;
        } else {
            deleteBtn.style.display = "none";
        }
    }

    if(feedback){
        feedback.innerText = isOwner
            ? "✏️ bewerken"
            : "👀 alleen bekijken";
    }

    enableForm(isOwner); // 🔥 key verschil
}
/* =============================
SAVE
============================= */

async function saveEvent(){

    const feedback = document.getElementById("feedback");

    const type = document.getElementById("eventType").value;
    const user_id = document.getElementById("email").value.trim();

    if(!user_id){
        feedback.innerText = "⚠️ vul email in";
        return;
    }

    setUserId(user_id);

    let payload = { type, user_id };

    /* TRIP */

    if(type === "trip"){

        const owner = document.getElementById("owner").value.trim();
        const destination = document.getElementById("destination").value.trim();
        const start = document.getElementById("start").value;
        let end = document.getElementById("end").value;

        if(!owner || !start){
            feedback.innerText = "⚠️ naam + start verplicht";
            return;
        }

        if(!end) end = start;

        if(end < start){
            feedback.innerText = "⚠️ eind vóór start";
            return;
        }

        const conflict = trips.find(t =>
            t.type === "trip" &&
            t.id !== editingId &&
            start <= t.end_date &&
            end >= t.start_date
        );

        if(conflict){
            feedback.innerText = `⚠️ conflict met ${conflict.owner}`;
            return;
        }

        payload = {
            ...payload,
            owner,
            destination,
            start_date: start,
            end_date: end,
            status: "aangevraagd"
        };
    }

    /* ONDERHOUD */

    if(type === "onderhoud"){

        const date = document.getElementById("onderhoudDate").value;
        const location = document.getElementById("location").value.trim();

        if(!date || !location){
            feedback.innerText = "⚠️ datum + locatie verplicht";
            return;
        }

        payload = {
            ...payload,
            owner: "Onderhoud",
            destination: location,
            start_date: date,
            end_date: date,
            status: "aangevraagd"
        };
    }

    /* INSERT / UPDATE */

    let query;

    if(editingId){
        query = supabaseClient
            .from("trip")
            .update(payload)
            .eq("id", editingId)
            .eq("user_id", editingUserId);
    } else {
        query = supabaseClient
            .from("trip")
            .insert([payload]);
    }

    const { error } = await query;

    if(error){
        console.error(error);
        feedback.innerText = "❌ opslaan mislukt";
        return;
    }

    feedback.innerText = "✅ opgeslagen";

    resetForm();
    await loadTrips();
}

/* =============================
DELETE
============================= */

async function deleteEvent(){

console.log("DELETE DEBUG", {
    editingId,
    editingUserId,
    currentUser: getUserId()
});


    const feedback = document.getElementById("feedback");
    const user_id = getUserId();

    if(!editingId) return;

    if(!confirm("Verwijderen?")) return;

    const { error } = await supabaseClient
        .from("trip")
        .delete()
        .eq("id", editingId)

    if(error){
        console.error(error);
        feedback.innerText = "❌ verwijderen mislukt";
        return;
    }

    feedback.innerText = "🗑️ verwijderd";

    resetForm();
    await loadTrips();
}

/* =============================
TYPE SWITCH
============================= */

function setupTypeSwitch(){

    const type = document.getElementById("eventType");
    const trip = document.getElementById("tripFields");
    const ond = document.getElementById("onderhoudFields");
    const title = document.querySelector(".formCard h2");

    type.addEventListener("change", () => {

        if(type.value === "trip"){
            trip.style.display = "block";
            ond.style.display = "none";
            title.innerText = editingId ? "Trip bewerken" : "Nieuwe trip";
        }

        if(type.value === "onderhoud"){
            trip.style.display = "none";
            ond.style.display = "block";
            title.innerText = editingId ? "Onderhoud bewerken" : "Nieuw onderhoud";
        }
    });
}

/* =============================
INIT (SAFE)
============================= */

window.addEventListener("DOMContentLoaded", () => {

    if(!document.getElementById("tripList")) return; // 💥 voorkomt crash op andere pagina's

    const saveBtn = document.getElementById("saveBtn");
    const deleteBtn = document.getElementById("deleteBtn");

    if(saveBtn) saveBtn.onclick = saveEvent;
    if(deleteBtn) deleteBtn.onclick = deleteEvent;

    setupTypeSwitch();
    initUser();
    loadTrips();
});